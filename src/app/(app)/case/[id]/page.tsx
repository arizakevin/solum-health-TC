import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CaseReviewClient } from "./case-review-client";

export const dynamic = "force-dynamic";

export default async function CaseReviewPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const caseData = await prisma.case
		.findUnique({
			where: { id },
			include: {
				documents: { orderBy: { uploadedAt: "asc" } },
				extractionFields: true,
			},
		})
		.catch(() => null);

	if (!caseData) notFound();

	const documents = caseData.documents.map((d) => ({
		id: d.id,
		filename: d.filename,
		contentType: d.contentType,
		pageCount: d.pageCount,
		uploadedAt: d.uploadedAt,
	}));

	const highCount = caseData.extractionFields.filter(
		(f) => f.confidence === "high",
	).length;
	const medCount = caseData.extractionFields.filter(
		(f) => f.confidence === "medium",
	).length;
	const total = caseData.extractionFields.length;
	const aggregateConfidence =
		total > 0
			? (highCount * 95 + medCount * 78 + (total - highCount - medCount) * 45) /
				total
			: 0;

	const extractionDate =
		caseData.extractionFields.length > 0
			? caseData.extractionFields[0].extractedAt
			: null;

	return (
		<CaseReviewClient
			caseId={id}
			caseStatus={caseData.status}
			documents={documents}
			extraction={
				(caseData.finalFormData ?? caseData.rawExtraction) as Record<
					string,
					unknown
				> | null
			}
			aggregateConfidence={aggregateConfidence}
			extractionDate={extractionDate}
		/>
	);
}
