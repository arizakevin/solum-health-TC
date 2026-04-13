import { NextResponse } from "next/server";
import { runCaseExtraction } from "@/lib/extraction/run-case-extraction";

export const maxDuration = 120;

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const caseId = body?.caseId as string | undefined;
		if (!caseId) {
			return NextResponse.json(
				{ error: "caseId is required" },
				{ status: 400 },
			);
		}

		const enhancedOcr = body?.enhancedOcr as boolean | undefined;
		const forceOcr = body?.forceOcr as boolean | undefined;

		const result = await runCaseExtraction(caseId, {
			enhancedOcr,
			forceOcr,
		});

		if (!result.ok) {
			return NextResponse.json(
				{
					error: result.error,
					...(result.details && { details: result.details }),
					...(result.raw && { raw: result.raw }),
				},
				{ status: result.status },
			);
		}

		return NextResponse.json({
			success: true,
			fieldCount: result.fieldCount,
			extraction: result.extraction,
			confidenceFollowUp: result.confidenceFollowUp,
		});
	} catch (error) {
		console.error("Extraction route error:", error);
		return NextResponse.json(
			{
				error: "Extraction failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
