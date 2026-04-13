/**
 * Benchmark extraction: builds document parts once, then times one structured call per target.
 * Does not write case extraction rows (may still update PDF text/pageCount like production).
 *
 * Required: BENCH_CASE_ID, DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Per target: API key for the provider you list (OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY).
 * Optional: BENCH_MODELS (comma-separated `openai:…`, `anthropic:…`, `gemini:…`, or bare Gemini id).
 *   Default targets skip any row whose key is missing. Document AI: same env vars as the app if you want OCR in the bench.
 * Flags: --shuffle, --out <file.json>
 *
 * Example: BENCH_CASE_ID=<uuid> BENCH_MODELS='openai:gpt-4o-mini,openai:gpt-4o' pnpm bench:extraction
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { runAnthropicStructuredExtraction } from "@/lib/extraction/anthropic-structured-extraction";
import { buildExtractionPartsForCase } from "@/lib/extraction/build-extraction-parts";
import type { GeminiStructuredExtractionResult } from "@/lib/extraction/gemini-structured-extraction";
import { runGeminiStructuredExtraction } from "@/lib/extraction/gemini-structured-extraction";
import { runOpenAIStructuredExtraction } from "@/lib/extraction/openai-structured-extraction";
import { countFlattenedExtractionFields } from "@/lib/extraction/run-case-extraction";
import { prisma } from "@/lib/prisma";

type BenchProvider = "openai" | "anthropic" | "gemini";

type BenchTarget = { provider: BenchProvider; model: string };

/**
 * Default roster: OpenAI first, then Anthropic. Targets whose API key is missing
 * are skipped with a warning (override `BENCH_MODELS` to force a single provider).
 */
const DEFAULT_BENCH_TARGETS: BenchTarget[] = [
	{ provider: "openai", model: "gpt-4o-mini" },
	{ provider: "anthropic", model: "claude-haiku-4-5-20251001" },
];

type BenchRow = {
	provider: BenchProvider;
	model: string;
	ms: number;
	ok: boolean;
	parseOk: boolean;
	fieldCount: number;
	hasLogprobsScore: boolean;
	error?: string;
};

function parseBenchTarget(entry: string): BenchTarget {
	const s = entry.trim();
	if (!s) return { provider: "gemini", model: "" };
	const idx = s.indexOf(":");
	if (idx === -1) {
		return { provider: "gemini", model: s };
	}
	const prefix = s.slice(0, idx).toLowerCase();
	const model = s.slice(idx + 1).trim();
	if (prefix === "openai") return { provider: "openai", model };
	if (prefix === "anthropic") return { provider: "anthropic", model };
	if (prefix === "gemini" || prefix === "google")
		return { provider: "gemini", model };
	return { provider: "gemini", model: s };
}

function shuffleInPlace<T>(arr: T[]): void {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const a = arr[i];
		const b = arr[j];
		if (a !== undefined && b !== undefined) {
			arr[i] = b;
			arr[j] = a;
		}
	}
}

function parseArgs(argv: string[]) {
	const shuffle = argv.includes("--shuffle");
	let outPath: string | null = null;
	const outIdx = argv.indexOf("--out");
	const outArg = argv[outIdx + 1];
	if (outIdx !== -1 && outArg !== undefined) {
		outPath = outArg;
	}
	return { shuffle, outPath };
}

function filterTargetsWithKeys(targets: BenchTarget[]): BenchTarget[] {
	const out: BenchTarget[] = [];
	for (const t of targets) {
		if (t.provider === "openai" && !process.env.OPENAI_API_KEY?.trim()) {
			console.warn(`Skipping openai:${t.model} (OPENAI_API_KEY not set).`);
			continue;
		}
		if (t.provider === "anthropic" && !process.env.ANTHROPIC_API_KEY?.trim()) {
			console.warn(
				`Skipping anthropic:${t.model} (ANTHROPIC_API_KEY not set).`,
			);
			continue;
		}
		if (t.provider === "gemini" && !process.env.GEMINI_API_KEY?.trim()) {
			console.warn(`Skipping gemini:${t.model} (GEMINI_API_KEY not set).`);
			continue;
		}
		out.push(t);
	}
	return out;
}

async function main() {
	const caseId = process.env.BENCH_CASE_ID?.trim();
	if (!caseId) {
		console.error("Set BENCH_CASE_ID to a case UUID that has documents.");
		process.exit(1);
	}

	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) {
		console.error(
			"Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
		);
		process.exit(1);
	}
	if (!process.env.DATABASE_URL) {
		console.error("Missing DATABASE_URL.");
		process.exit(1);
	}

	const modelsEnv = process.env.BENCH_MODELS?.trim();
	const targets: BenchTarget[] = modelsEnv
		? modelsEnv
				.split(",")
				.map((m) => m.trim())
				.filter(Boolean)
				.map(parseBenchTarget)
				.filter((t) => t.model.length > 0)
		: [...DEFAULT_BENCH_TARGETS];

	if (targets.length === 0) {
		console.error("No benchmark targets after parsing BENCH_MODELS.");
		process.exit(1);
	}

	const runnableTargets = filterTargetsWithKeys(targets);
	if (runnableTargets.length === 0) {
		console.error(
			"No runnable targets: set API keys for the providers you listed (see script header).",
		);
		process.exit(1);
	}

	const { shuffle, outPath } = parseArgs(process.argv);
	if (shuffle) shuffleInPlace(runnableTargets);

	const supabase = createClient(url, key);

	const documents = await prisma.document.findMany({
		where: { caseId },
		select: { id: true, storagePath: true, filename: true, contentType: true },
	});

	if (documents.length === 0) {
		console.error(`No documents for case ${caseId}.`);
		process.exit(1);
	}

	console.log(
		`Building parts once for case ${caseId.slice(0, 8)}… (${documents.length} doc(s))`,
	);
	const buildStart = performance.now();
	const parts = await buildExtractionPartsForCase(caseId, documents, supabase, {
		enhancedOcr: true,
		forceOcr: false,
	});
	const partsBuildMs = Math.round(performance.now() - buildStart);
	console.log(`Parts ready in ${partsBuildMs} ms\n`);

	const rows: BenchRow[] = [];

	for (const t of runnableTargets) {
		const start = performance.now();
		let result: GeminiStructuredExtractionResult;
		if (t.provider === "openai") {
			result = await runOpenAIStructuredExtraction(parts, t.model);
		} else if (t.provider === "anthropic") {
			result = await runAnthropicStructuredExtraction(parts, t.model);
		} else {
			result = await runGeminiStructuredExtraction(parts, t.model);
		}
		const ms = Math.round(performance.now() - start);

		if (!result.ok) {
			rows.push({
				provider: t.provider,
				model: t.model,
				ms,
				ok: false,
				parseOk: false,
				fieldCount: 0,
				hasLogprobsScore: false,
				error: result.error,
			});
			continue;
		}

		rows.push({
			provider: t.provider,
			model: t.model,
			ms,
			ok: true,
			parseOk: true,
			fieldCount: countFlattenedExtractionFields(result.extraction),
			hasLogprobsScore: result.extractionConfidenceFromLogprobs != null,
		});
	}

	console.log(
		"| Provider | Model | ms | ok | parse ok | fields | logprobs score |",
	);
	console.log("| --- | --- | ---: | :--- | :--- | ---: | :--- |");
	for (const r of rows) {
		console.log(
			`| ${r.provider} | ${r.model} | ${r.ms} | ${r.ok ? "yes" : "no"} | ${r.parseOk ? "yes" : "no"} | ${r.fieldCount} | ${r.hasLogprobsScore ? "yes" : "no"} |${r.error ? ` ${r.error}` : ""}`,
		);
	}

	if (outPath) {
		const payload = {
			caseId,
			targets: runnableTargets,
			shuffle,
			partsBuildMs,
			rows,
			createdAt: new Date().toISOString(),
		};
		await mkdir(dirname(outPath), { recursive: true });
		await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
		console.log(`\nWrote ${outPath}`);
	}

	await prisma.$disconnect();
	process.exit(rows.some((r) => !r.ok) ? 1 : 0);
}

void main().catch((e) => {
	console.error(e);
	void prisma.$disconnect();
	process.exit(1);
});
