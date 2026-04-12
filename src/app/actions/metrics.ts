"use server";

import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Aggregated metrics — optimised with groupBy / aggregate            */
/* ------------------------------------------------------------------ */

export interface MetricsData {
	totalCases: number;
	avgExtractionConfidence: number;
	extractionConfidenceIsLegacyEstimate: boolean;
	avgFormCompleteness: number;
	fieldsCorrected: { count: number; total: number };
	docsProcessed: number;
	correctionsBySection: Record<string, { corrected: number; total: number }>;
}

export async function getMetricsData(): Promise<MetricsData> {
	try {
		const [totalCases, docsProcessed, confidenceAgg, fieldAggs, sectionGroups] =
			await Promise.all([
				prisma.case.count(),
				prisma.document.count(),
				prisma.case.aggregate({
					_avg: { extractionConfidence: true },
					_count: { extractionConfidence: true },
				}),
				prisma.extractionField.aggregate({
					_count: { _all: true },
					where: undefined,
				}),
				prisma.extractionField.groupBy({
					by: ["section", "wasCorrected"],
					_count: { _all: true },
				}),
			]);

		const correctedTotal = await prisma.extractionField.count({
			where: { wasCorrected: true },
		});
		const totalFields = fieldAggs._count._all;

		// Extraction confidence
		const hasLogprobs = confidenceAgg._count.extractionConfidence > 0;
		let avgExtractionConfidence = 0;

		if (hasLogprobs) {
			avgExtractionConfidence = confidenceAgg._avg.extractionConfidence ?? 0;
		} else {
			const labelCounts = await prisma.extractionField.groupBy({
				by: ["confidence"],
				_count: { _all: true },
				where: {
					OR: [{ finalValue: { not: "" } }, { autoValue: { not: "" } }],
				},
			});
			let weighted = 0;
			let filled = 0;
			for (const g of labelCounts) {
				const n = g._count._all;
				filled += n;
				if (g.confidence === "high") weighted += n * 95;
				else if (g.confidence === "medium") weighted += n * 78;
				else weighted += n * 45;
			}
			avgExtractionConfidence = filled > 0 ? weighted / filled : 0;
		}

		// Form completeness via raw SQL to avoid loading all rows
		const completenessRows = await prisma.$queryRaw<
			{ avg_completeness: number | null }[]
		>`
			SELECT AVG(
				CASE WHEN total > 0 THEN filled::float / total * 100 ELSE 0 END
			) as avg_completeness
			FROM (
				SELECT
					case_id,
					COUNT(*) as total,
					COUNT(*) FILTER (
						WHERE COALESCE(final_value, auto_value, '') <> ''
					) as filled
				FROM extraction_fields
				GROUP BY case_id
			) sub
		`;
		const avgFormCompleteness = completenessRows[0]?.avg_completeness ?? 0;

		// Section corrections
		const correctionsBySection: Record<
			string,
			{ corrected: number; total: number }
		> = {};
		for (const g of sectionGroups) {
			if (!correctionsBySection[g.section]) {
				correctionsBySection[g.section] = { corrected: 0, total: 0 };
			}
			correctionsBySection[g.section].total += g._count._all;
			if (g.wasCorrected) {
				correctionsBySection[g.section].corrected += g._count._all;
			}
		}

		return {
			totalCases,
			avgExtractionConfidence,
			extractionConfidenceIsLegacyEstimate: !hasLogprobs,
			avgFormCompleteness,
			fieldsCorrected: { count: correctedTotal, total: totalFields },
			docsProcessed,
			correctionsBySection,
		};
	} catch {
		return {
			totalCases: 0,
			avgExtractionConfidence: 0,
			extractionConfidenceIsLegacyEstimate: true,
			avgFormCompleteness: 0,
			fieldsCorrected: { count: 0, total: 0 },
			docsProcessed: 0,
			correctionsBySection: {},
		};
	}
}

/* ------------------------------------------------------------------ */
/*  Paginated corrections                                              */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 10;

export interface CorrectionRow {
	caseId: string;
	field: string;
	originalValue: string;
	correctedValue: string;
	section: string;
	date: string;
}

export interface PaginatedCorrections {
	rows: CorrectionRow[];
	total: number;
	page: number;
	pageSize: number;
	pageCount: number;
}

export async function getCorrections(page = 1): Promise<PaginatedCorrections> {
	const safePage = Math.max(1, page);

	const [total, rows] = await Promise.all([
		prisma.extractionField.count({ where: { wasCorrected: true } }),
		prisma.extractionField.findMany({
			where: { wasCorrected: true },
			orderBy: { extractedAt: "desc" },
			skip: (safePage - 1) * PAGE_SIZE,
			take: PAGE_SIZE,
		}),
	]);

	return {
		rows: rows.map((f) => ({
			caseId: f.caseId,
			field: f.fieldName,
			originalValue: f.autoValue ?? "",
			correctedValue: f.finalValue ?? "",
			section: f.section,
			date: f.extractedAt.toISOString(),
		})),
		total,
		page: safePage,
		pageSize: PAGE_SIZE,
		pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
	};
}
