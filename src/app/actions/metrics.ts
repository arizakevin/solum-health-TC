"use server";

import { prisma } from "@/lib/prisma";

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
