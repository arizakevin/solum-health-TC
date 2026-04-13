/**
 * One-time fixup: reset corrupted array field rows back to per-item values.
 *
 * The old saveFormDraft wrote the *full joined string* as every row's finalValue
 * for array fields (icd10Codes, cptCodes, etc.). This script detects those rows
 * (finalValue contains commas AND equals the join of all rows in the group) and
 * resets finalValue = autoValue, wasCorrected = false.
 *
 * Safe to run repeatedly — only touches rows that match the corruption pattern.
 *
 * Usage:  npx tsx scripts/fix-legacy-array-finalvalues.ts
 */

import { prisma } from "@/lib/prisma";

async function main() {
	const groups = await prisma.$queryRaw<
		{ case_id: string; section: string; field_name: string }[]
	>`
		WITH grp AS (
			SELECT
				case_id, section, field_name,
				COUNT(*) AS cnt,
				string_agg(auto_value, ', ' ORDER BY id) AS joined_auto,
				array_agg(DISTINCT final_value) AS distinct_finals
			FROM extraction_fields
			GROUP BY case_id, section, field_name
			HAVING COUNT(*) > 1
		)
		SELECT case_id, section, field_name
		FROM grp
		WHERE array_length(distinct_finals, 1) = 1
		  AND distinct_finals[1] = joined_auto
	`;

	if (groups.length === 0) {
		console.log("No corrupted array fields found. Nothing to fix.");
		return;
	}

	console.log(`Found ${groups.length} corrupted field groups. Fixing...`);

	let fixed = 0;
	for (const g of groups) {
		const result = await prisma.extractionField.updateMany({
			where: {
				caseId: g.case_id,
				section: g.section,
				fieldName: g.field_name,
			},
			data: {
				wasCorrected: false,
			},
		});
		fixed += result.count;

		const rows = await prisma.extractionField.findMany({
			where: {
				caseId: g.case_id,
				section: g.section,
				fieldName: g.field_name,
			},
			orderBy: { id: "asc" },
		});
		for (const row of rows) {
			await prisma.extractionField.update({
				where: { id: row.id },
				data: { finalValue: row.autoValue ?? "" },
			});
		}
	}

	console.log(
		`Done. Reset ${fixed} rows across ${groups.length} field groups.`,
	);
}

main()
	.catch((err) => {
		console.error("Fix script failed:", err);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
