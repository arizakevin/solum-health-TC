import type { Part } from "@google/genai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isDocumentAiConfigured } from "@/lib/document-ai/config";
import { runDocumentOcr } from "@/lib/document-ai/run-document-ocr";
import { prisma } from "@/lib/prisma";

const IMAGE_MIME_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/tiff",
	"image/tif",
]);

export type ExtractionDocumentRow = {
	id: string;
	storagePath: string;
	filename: string;
	contentType: string;
};

export type BuildExtractionPartsOptions = {
	enhancedOcr?: boolean;
	forceOcr?: boolean;
};

/**
 * Downloads case documents from storage and builds Gemini `Part[]` (text, OCR, inline PDF/images)
 * identical to the production extraction pipeline. Updates each document's `textContent` / `pageCount`
 * when PDF text is extracted via pdf.js.
 */
export async function buildExtractionPartsForCase(
	_caseId: string,
	documents: ExtractionDocumentRow[],
	supabase: SupabaseClient,
	options: BuildExtractionPartsOptions = {},
): Promise<Part[]> {
	const enhancedOcr = options.enhancedOcr ?? true;
	const forceOcr = options.forceOcr ?? false;
	const ocrAvailable = enhancedOcr && isDocumentAiConfigured();

	const parts: Part[] = [];

	for (const doc of documents) {
		const { data, error } = await supabase.storage
			.from("documents")
			.download(doc.storagePath);

		if (error || !data) {
			console.error(`Failed to download ${doc.filename}:`, error);
			continue;
		}

		const buffer = Buffer.from(await data.arrayBuffer());
		const pdfBytes = new Uint8Array(buffer);

		if (doc.contentType === "application/pdf") {
			let textContent = "";
			try {
				const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
				const pdfDoc = await pdfjs.getDocument({ data: pdfBytes }).promise;

				for (let i = 1; i <= pdfDoc.numPages; i++) {
					const page = await pdfDoc.getPage(i);
					const content = await page.getTextContent();
					const pageText = content.items
						.map((item: unknown) => {
							const textItem = item as { str?: string };
							return textItem.str ?? "";
						})
						.join(" ");
					textContent += `\n--- Page ${i} ---\n${pageText}`;
				}

				await prisma.document.update({
					where: { id: doc.id },
					data: {
						textContent,
						pageCount: pdfDoc.numPages,
					},
				});
			} catch (pdfError) {
				console.error(
					`PDF text extraction failed for ${doc.filename}:`,
					pdfError,
				);
			}

			const pdfjsSparse = textContent.trim().length <= 50;

			if (!pdfjsSparse) {
				parts.push({
					text: `\n\n=== Document: ${doc.filename} (text extracted) ===\n${textContent}`,
				});
			}

			if (ocrAvailable && (pdfjsSparse || forceOcr)) {
				const ocrText = await runDocumentOcr(buffer, "application/pdf");
				if (ocrText) {
					parts.push({
						text: `\n\n=== Document: ${doc.filename} (Document AI OCR) ===\n${ocrText}`,
					});
				}
			}

			parts.push({
				inlineData: {
					mimeType: "application/pdf",
					data: buffer.toString("base64"),
				},
			});
		} else if (IMAGE_MIME_TYPES.has(doc.contentType)) {
			if (ocrAvailable) {
				const ocrText = await runDocumentOcr(buffer, doc.contentType);
				if (ocrText) {
					parts.push({
						text: `\n\n=== Document: ${doc.filename} (Document AI OCR) ===\n${ocrText}`,
					});
				}
			}

			parts.push({
				inlineData: {
					mimeType: doc.contentType,
					data: buffer.toString("base64"),
				},
			});
		} else {
			parts.push({
				inlineData: {
					mimeType: doc.contentType,
					data: buffer.toString("base64"),
				},
			});
		}
	}

	parts.push({
		text: "\n\nPlease extract all available information from the documents above and return the structured JSON matching the service request form schema.",
	});

	return parts;
}
