import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { ServiceRequestPdf } from "@/lib/pdf/service-request-pdf";
import { prisma } from "@/lib/prisma";
import type { ServiceRequestExtraction } from "@/lib/types/service-request";

export const maxDuration = 30;

export async function POST(request: Request) {
	try {
		const { caseId } = await request.json();
		if (!caseId) {
			return NextResponse.json({ error: "caseId required" }, { status: 400 });
		}

		const caseData = await prisma.case.findUnique({
			where: { id: caseId },
		});

		if (!caseData) {
			return NextResponse.json({ error: "Case not found" }, { status: 404 });
		}

		const formData = (caseData.finalFormData ??
			caseData.rawExtraction) as unknown as ServiceRequestExtraction | null;

		if (!formData) {
			return NextResponse.json(
				{ error: "No form data available" },
				{ status: 400 },
			);
		}

		const buffer = await renderToBuffer(
			ServiceRequestPdf({ data: formData, caseId }),
		);

		return new NextResponse(new Uint8Array(buffer), {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `inline; filename="service-request-${caseId.slice(0, 8)}.pdf"`,
			},
		});
	} catch (error) {
		console.error("PDF generation error:", error);
		return NextResponse.json(
			{
				error: "PDF generation failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
