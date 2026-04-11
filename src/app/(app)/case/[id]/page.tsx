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

	const docs = caseData.documents;
	const fields = caseData.extractionFields;

	const documents = docs.map((d: (typeof docs)[number]) => ({
		id: d.id,
		filename: d.filename,
		contentType: d.contentType,
		pageCount: d.pageCount,
		uploadedAt: d.uploadedAt,
	}));

	const highCount = fields.filter(
		(f: (typeof fields)[number]) => f.confidence === "high",
	).length;
	const medCount = fields.filter(
		(f: (typeof fields)[number]) => f.confidence === "medium",
	).length;
	const total = fields.length;
	const aggregateConfidence =
		total > 0
			? (highCount * 95 + medCount * 78 + (total - highCount - medCount) * 45) /
				total
			: 0;

	const extractionDate =
		fields.length > 0 ? fields[0].extractedAt : null;

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
