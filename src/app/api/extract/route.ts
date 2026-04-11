import type { Content, Part } from "@google/genai";
import { NextResponse } from "next/server";
import { EXTRACTION_SYSTEM_PROMPT } from "@/lib/ai/extraction-prompt";
import { serviceRequestResponseSchema } from "@/lib/ai/extraction-schema";
import { getExtractionModelId, getGeminiClient } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type {
	Confidence,
	ServiceRequestExtraction,
} from "@/lib/types/service-request";

export const maxDuration = 120;

export async function POST(request: Request) {
	try {
		const { caseId } = await request.json();
		if (!caseId) {
			return NextResponse.json(
				{ error: "caseId is required" },
				{ status: 400 },
			);
		}

		const supabase = await createClient();

		await prisma.case.update({
			where: { id: caseId },
			data: { status: "Extracting" },
		});

		const documents = await prisma.document.findMany({
			where: { caseId },
		});

		if (documents.length === 0) {
			return NextResponse.json(
				{ error: "No documents found for this case" },
				{ status: 400 },
			);
		}

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

			if (doc.contentType === "application/pdf") {
				let textContent = "";
				try {
					const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
					const pdfDoc = await pdfjs.getDocument({ data: buffer }).promise;

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

				if (textContent.trim().length > 50) {
					parts.push({
						text: `\n\n=== Document: ${doc.filename} (text extracted) ===\n${textContent}`,
					});
				}

				parts.push({
					inlineData: {
						mimeType: "application/pdf",
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
		const response = await ai.models.generateContent({
			model: getExtractionModelId(),
			contents: [{ role: "user", parts }] as Content[],
			config: {
				systemInstruction: EXTRACTION_SYSTEM_PROMPT,
				responseMimeType: "application/json",
				responseSchema: serviceRequestResponseSchema,
				temperature: 0.1,
			},
		});

		const responseText = response.text ?? "";
		let extraction: ServiceRequestExtraction;

		try {
			extraction = JSON.parse(responseText);
		} catch {
			return NextResponse.json(
				{ error: "Failed to parse extraction response", raw: responseText },
				{ status: 500 },
			);
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
			},
		});

		return NextResponse.json({
			success: true,
			fieldCount: fieldRecords.length,
			extraction,
		});
	} catch (error) {
		console.error("Extraction error:", error);
		return NextResponse.json(
			{
				error: "Extraction failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
