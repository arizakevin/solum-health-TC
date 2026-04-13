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

function toInt(n: unknown): number {
	if (typeof n === "bigint") return Number(n);
	if (typeof n === "number") return n;
	return Number(n ?? 0);
}

export async function getMetricsData(): Promise<MetricsData> {
	try {
		const [
			totalCases,
			docsProcessed,
			confidenceAgg,
			logicalFieldAgg,
			sectionLogicalRows,
		] = await Promise.all([
			prisma.case.count(),
			prisma.document.count(),
			prisma.case.aggregate({
				_avg: { extractionConfidence: true },
				_count: { extractionConfidence: true },
			}),
			prisma.$queryRaw<
				{ corrected: bigint | number; total: bigint | number }[]
			>`
				WITH lf AS (
					SELECT case_id, section, field_name,
						bool_or(was_corrected) AS is_corrected
					FROM extraction_fields
					GROUP BY case_id, section, field_name
				)
				SELECT
					COUNT(*) FILTER (WHERE is_corrected)::bigint AS corrected,
					COUNT(*)::bigint AS total
				FROM lf
			`,
			prisma.$queryRaw<
				{
					section: string;
					corrected: bigint | number;
					total: bigint | number;
				}[]
			>`
				WITH lf AS (
					SELECT case_id, section, field_name,
						bool_or(was_corrected) AS is_corrected
					FROM extraction_fields
					GROUP BY case_id, section, field_name
				)
				SELECT section,
					COUNT(*) FILTER (WHERE is_corrected)::bigint AS corrected,
					COUNT(*)::bigint AS total
				FROM lf
				GROUP BY section
			`,
		]);

		const lfRow = logicalFieldAgg[0];
		const correctedTotal = lfRow ? toInt(lfRow.corrected) : 0;
		const totalLogicalFields = lfRow ? toInt(lfRow.total) : 0;

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

		const correctionsBySection: Record<
			string,
			{ corrected: number; total: number }
		> = {};
		for (const row of sectionLogicalRows) {
			correctionsBySection[row.section] = {
				corrected: toInt(row.corrected),
				total: toInt(row.total),
			};
		}

		return {
			totalCases,
			avgExtractionConfidence,
			extractionConfidenceIsLegacyEstimate: !hasLogprobs,
			avgFormCompleteness,
			fieldsCorrected: {
				count: correctedTotal,
				total: totalLogicalFields,
			},
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
	const offset = (safePage - 1) * PAGE_SIZE;

	const [countRows, rawRows] = await Promise.all([
		prisma.$queryRaw<{ n: bigint | number }[]>`
			SELECT COUNT(*)::bigint AS n
			FROM (
				SELECT 1
				FROM extraction_fields
				GROUP BY case_id, section, field_name
				HAVING bool_or(was_corrected)
			) t
		`,
		prisma.$queryRaw<
			{
				case_id: string;
				section: string;
				field_name: string;
				original_concat: string | null;
				final_concat: string | null;
				activity_at: Date;
			}[]
		>`
			WITH grouped AS (
				SELECT
					ef.case_id,
					ef.section,
					ef.field_name,
					bool_or(ef.was_corrected) AS is_corrected,
					string_agg(ef.auto_value, ', ' ORDER BY ef.auto_value) AS original_concat,
					string_agg(ef.final_value, ', ' ORDER BY ef.final_value) AS final_concat
				FROM extraction_fields ef
				GROUP BY ef.case_id, ef.section, ef.field_name
			)
			SELECT
				g.case_id,
				g.section,
				g.field_name,
				g.original_concat,
				g.final_concat,
				c.updated_at AS activity_at
			FROM grouped g
			INNER JOIN cases c ON c.id = g.case_id
			WHERE g.is_corrected
			ORDER BY c.updated_at DESC, g.case_id, g.section, g.field_name
			LIMIT ${PAGE_SIZE}
			OFFSET ${offset}
		`,
	]);

	const total = countRows[0] ? toInt(countRows[0].n) : 0;

	return {
		rows: rawRows.map((r) => ({
			caseId: r.case_id,
			field: r.field_name,
			originalValue: r.original_concat ?? "",
			correctedValue: r.final_concat ?? "",
			section: r.section,
			date: r.activity_at.toISOString(),
		})),
		total,
		page: safePage,
		pageSize: PAGE_SIZE,
		pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
	};
}
