/**
 * Batch re-run extraction for every case that has documents (fills extractionConfidence).
 * Uses Supabase service role for storage downloads — run only in trusted environments.
 *
 * Usage (from repo root, after migrate):
 *   npm run reextract:all -- --yes
 */

import { createClient } from "@supabase/supabase-js";
import { runCaseExtractionPipeline } from "@/lib/extraction/run-case-extraction";
import { prisma } from "@/lib/prisma";

async function main() {
	if (!process.argv.includes("--yes")) {
		console.error(
			"Refusing to run without --yes (re-calls Gemini for every case with documents).",
		);
		console.error("Usage: npm run reextract:all -- --yes");
		process.exit(1);
	}

	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) {
		console.error(
			"Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.",
		);
		process.exit(1);
	}

	if (!process.env.DATABASE_URL) {
		console.error("Missing DATABASE_URL.");
		process.exit(1);
	}

	if (!process.env.GEMINI_API_KEY) {
		console.error("Missing GEMINI_API_KEY.");
		process.exit(1);
	}

	const supabase = createClient(url, key);

	const cases = await prisma.case.findMany({
		where: { documents: { some: {} } },
		select: { id: true },
		orderBy: { createdAt: "asc" },
	});

	console.log(`Found ${cases.length} case(s) with documents.\n`);

	let ok = 0;
	let fail = 0;
	for (const { id } of cases) {
		process.stdout.write(`${id.slice(0, 8)}… `);
		const result = await runCaseExtractionPipeline(
			id,
			{ enhancedOcr: true, forceOcr: false },
			supabase,
		);
		if (!result.ok) {
			fail++;
			console.log(`FAIL (${result.status}): ${result.error}`);
			if (result.details) console.log(`       ${result.details}`);
		} else {
			ok++;
			console.log(`OK (${result.fieldCount} fields)`);
		}
	}

	console.log(`\nDone: ${ok} succeeded, ${fail} failed.`);
	await prisma.$disconnect();
	process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
