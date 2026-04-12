import type { Content, Part } from "@google/genai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EXTRACTION_SYSTEM_PROMPT } from "@/lib/ai/extraction-prompt";
import { serviceRequestResponseSchema } from "@/lib/ai/extraction-schema";
import { getExtractionModelId, getGeminiClient } from "@/lib/ai/gemini";
import { avgLogprobsToExtractionConfidencePercent } from "@/lib/ai/logprobs-confidence";
import { runOpenAIConfidencePass } from "@/lib/ai/openai-confidence-pass";
import { isDocumentAiConfigured } from "@/lib/document-ai/config";
import { runDocumentOcr } from "@/lib/document-ai/run-document-ocr";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type {
	Confidence,
	ServiceRequestExtraction,
} from "@/lib/types/service-request";

export interface ExtractionOptions {
	/** Enable Document AI OCR for scanned/handwritten docs (default: true when configured) */
	enhancedOcr?: boolean;
	/** Force OCR on all documents including rich-text PDFs (default: false) */
	forceOcr?: boolean;
}

const IMAGE_MIME_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/tiff",
	"image/tif",
]);

export type RunCaseExtractionResult =
	| {
			ok: true;
			fieldCount: number;
			extraction: ServiceRequestExtraction;
	  }
	| {
			ok: false;
			status: number;
			error: string;
			details?: string;
			raw?: string;
	  };

/**
 * Runs the extraction pipeline for a case (Supabase storage + Gemini + Prisma).
 * Use from Server Actions or Route Handlers — not via server-side `fetch` to `/api/extract`,
 * which does not carry the user session and will be redirected by `proxy` to HTML sign-in.
 */
export async function runCaseExtraction(
	caseId: string,
	options: ExtractionOptions = {},
): Promise<RunCaseExtractionResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, status: 401, error: "Not authenticated" };
	}

	const owned = await prisma.case.findFirst({
		where: { id: caseId, userId: user.id },
		select: { id: true },
	});
	if (!owned) {
		return { ok: false, status: 404, error: "Case not found" };
	}

	return runCaseExtractionPipeline(caseId, options, supabase);
}

/**
 * Runs download → OCR (optional) → Gemini → Prisma for a case.
 * Pass a Supabase client with storage access (user session or service role for scripts).
 */
export async function runCaseExtractionPipeline(
	caseId: string,
	options: ExtractionOptions,
	supabase: SupabaseClient,
): Promise<RunCaseExtractionResult> {
	try {
		await prisma.case.update({
			where: { id: caseId },
			data: { status: "Extracting" },
		});

		const documents = await prisma.document.findMany({
			where: { caseId },
		});

		if (documents.length === 0) {
			return {
				ok: false,
				status: 400,
				error: "No documents found for this case",
			};
		}

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

		const ai = getGeminiClient();
		const modelId = getExtractionModelId();
		const contents = [{ role: "user", parts }] as Content[];
		const baseConfig = {
			systemInstruction: EXTRACTION_SYSTEM_PROMPT,
			responseMimeType: "application/json" as const,
			responseSchema: serviceRequestResponseSchema,
			temperature: 0.1,
		};

		let response: Awaited<ReturnType<typeof ai.models.generateContent>>;
		let extractionConfidence: number | null = null;

		// Try Gemini with logprobs first; fall back to plain extraction if unsupported
		try {
			response = await ai.models.generateContent({
				model: modelId,
				contents,
				config: {
					...baseConfig,
					responseLogprobs: true,
					logprobs: 5,
				},
			});
			const rawLogprobs = response.candidates?.[0]?.avgLogprobs;
			if (rawLogprobs != null) {
				extractionConfidence =
					avgLogprobsToExtractionConfidencePercent(rawLogprobs);
			}
		} catch (firstErr) {
			const msg =
				firstErr instanceof Error ? firstErr.message : String(firstErr);
			const logprobsUnsupported =
				msg.includes("Logprobs is not enabled") ||
				(/logprob/i.test(msg) &&
					(/not enabled/i.test(msg) || /INVALID_ARGUMENT/i.test(msg)));
			if (!logprobsUnsupported) {
				throw firstErr;
			}
			response = await ai.models.generateContent({
				model: modelId,
				contents,
				config: baseConfig,
			});
		}

		const responseText = response.text ?? "";
		let extraction: ServiceRequestExtraction;

		try {
			extraction = JSON.parse(responseText);
		} catch {
			return {
				ok: false,
				status: 500,
				error: "Failed to parse extraction response",
				raw: responseText,
			};
		}

		// Fallback: if Gemini didn't provide logprobs, use OpenAI confidence pass
		if (extractionConfidence == null && process.env.OPENAI_API_KEY) {
			extractionConfidence = await runOpenAIConfidencePass(extraction);
		}

		await prisma.extractionField.deleteMany({ where: { caseId } });

		const fieldRecords: {
			caseId: string;
			section: string;
			fieldName: string;
			autoValue: string;
			finalValue: string;
			confidence: string;
		}[] = [];

		for (const [sectionKey, sectionData] of Object.entries(extraction)) {
			if (typeof sectionData !== "object" || sectionData === null) continue;

			for (const [fieldKey, fieldData] of Object.entries(
				sectionData as Record<string, unknown>,
			)) {
				if (Array.isArray(fieldData)) {
					for (const item of fieldData) {
						const f = item as { value: string; confidence: Confidence };
						fieldRecords.push({
							caseId,
							section: sectionKey,
							fieldName: fieldKey,
							autoValue: f.value ?? "",
							finalValue: f.value ?? "",
							confidence: f.confidence ?? "low",
						});
					}
				} else if (
					typeof fieldData === "object" &&
					fieldData !== null &&
					"value" in fieldData
				) {
					const f = fieldData as { value: string; confidence: Confidence };
					fieldRecords.push({
						caseId,
						section: sectionKey,
						fieldName: fieldKey,
						autoValue: f.value ?? "",
						finalValue: f.value ?? "",
						confidence: f.confidence ?? "low",
					});
				}
			}
		}

		if (fieldRecords.length > 0) {
			await prisma.extractionField.createMany({ data: fieldRecords });
		}

		await prisma.case.update({
			where: { id: caseId },
			data: {
				status: "In Review",
				rawExtraction: JSON.parse(JSON.stringify(extraction)),
				finalFormData: JSON.parse(JSON.stringify(extraction)),
				extractionConfidence,
			},
		});

		return {
			ok: true,
			fieldCount: fieldRecords.length,
			extraction,
		};
	} catch (error) {
		console.error("Extraction error:", error);
		return {
			ok: false,
			status: 500,
			error: "Extraction failed",
			details: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
