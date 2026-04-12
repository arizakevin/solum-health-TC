import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isDocumentAiConfigured } from "@/lib/document-ai/config";
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

	const formTotalCount = fields.length;
	const formFilledCount = fields.filter(
		(f: (typeof fields)[number]) =>
			(f.finalValue ?? f.autoValue ?? "").trim() !== "",
	).length;

	const extractionConfidencePercent =
		caseData.extractionConfidence != null &&
		Number.isFinite(caseData.extractionConfidence)
			? caseData.extractionConfidence
			: null;

	const extractionDate = fields.length > 0 ? fields[0].extractedAt : null;

	return (
		<Suspense>
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
				extractionConfidencePercent={extractionConfidencePercent}
				formFilledCount={formFilledCount}
				formTotalCount={formTotalCount}
				extractionDate={extractionDate}
				ocrAvailable={isDocumentAiConfigured()}
			/>
		</Suspense>
	);
}
