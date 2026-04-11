import type { Content } from "@google/genai";
import { getAssistantModelId, getGeminiClient } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Annie, an AI case assistant for AuthScribe by Solum Health.
You help healthcare administrators with prior authorization and service request processing.
You are knowledgeable about:
- Prior authorization processes and forms (sections A through G)
- Medical coding (CPT, ICD-10)
- Insurance terminology and workflows
- Document requirements for service requests

Your tone is professional, helpful, and concise. If the user provides a case ID, you can reference the case's extracted data to answer questions.

Keep responses focused and actionable. Use bullet points for lists. If you don't know something, say so rather than guessing.`;

export async function POST(request: Request) {
	try {
		const { messages, caseId } = await request.json();

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return new Response("Unauthorized", { status: 401 });
		}

		let caseContext = "";
		if (caseId) {
			const caseData = await prisma.case.findUnique({
				where: { id: caseId },
				include: { documents: true, extractionFields: true },
			});
			if (caseData) {
				const formData = caseData.finalFormData ?? caseData.rawExtraction;
				caseContext = `\n\nCurrent case context (ID: ${caseId.slice(0, 8)}):
- Status: ${caseData.status}
- Documents: ${caseData.documents.map((d: { filename: string }) => d.filename).join(", ") || "None"}
- Extracted fields: ${caseData.extractionFields.length}
- Fields with corrections: ${caseData.extractionFields.filter((f: { wasCorrected: boolean }) => f.wasCorrected).length}
${formData ? `- Form data preview: ${JSON.stringify(formData).slice(0, 500)}...` : ""}`;
			}
		}

		const contents: Content[] = messages.map(
			(msg: { role: string; content: string }) => ({
				role: msg.role === "assistant" ? "model" : "user",
				parts: [{ text: msg.content }],
			}),
		);

		const ai = getGeminiClient();
		const response = await ai.models.generateContentStream({
			model: getAssistantModelId(),
			contents,
			config: {
				systemInstruction: SYSTEM_PROMPT + caseContext,
				temperature: 0.7,
				maxOutputTokens: 1024,
			},
		});

		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of response) {
						const text = chunk.text ?? "";
						if (text) {
							controller.enqueue(
								encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
							);
						}
					}
					controller.enqueue(encoder.encode("data: [DONE]\n\n"));
					controller.close();
				} catch (err) {
					controller.enqueue(
						encoder.encode(
							`data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Stream error" })}\n\n`,
						),
					);
					controller.close();
				}
			},
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			},
		});
	} catch (error) {
		console.error("Assistant error:", error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Assistant failed",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
}
