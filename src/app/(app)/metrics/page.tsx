import { MetricsDashboard } from "@/components/metrics-dashboard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function legacyLabelAvgOnFilledFields(
	fields: {
		confidence: string;
		autoValue: string | null;
		finalValue: string | null;
	}[],
): number {
	const filled = fields.filter(
		(f) => (f.finalValue ?? f.autoValue ?? "").trim() !== "",
	);
	if (filled.length === 0) return 0;
	let high = 0;
	let med = 0;
	for (const f of filled) {
		if (f.confidence === "high") high++;
		else if (f.confidence === "medium") med++;
	}
	const low = filled.length - high - med;
	return (high * 95 + med * 78 + low * 45) / filled.length;
}

async function getMetrics() {
	try {
		const totalCases = await prisma.case.count();
		const docsProcessed = await prisma.document.count();
		const allFields = await prisma.extractionField.findMany();
		const cases = await prisma.case.findMany({
			include: { extractionFields: true },
		});

		const withLogprobs = cases.filter(
			(c) =>
				c.extractionConfidence != null &&
				Number.isFinite(c.extractionConfidence),
		);
		const extractionConfidenceIsLegacyEstimate = withLogprobs.length === 0;
		const avgExtractionConfidence =
			withLogprobs.length > 0
				? withLogprobs.reduce(
						(s, c) => s + (c.extractionConfidence as number),
						0,
					) / withLogprobs.length
				: legacyLabelAvgOnFilledFields(allFields);

		const completenessPercents: number[] = [];
		for (const c of cases) {
			const f = c.extractionFields;
			const t = f.length;
			if (t === 0) continue;
			const filled = f.filter(
				(x) => (x.finalValue ?? x.autoValue ?? "").trim() !== "",
			).length;
			completenessPercents.push((filled / t) * 100);
		}
		const avgFormCompleteness =
			completenessPercents.length > 0
				? completenessPercents.reduce((a, b) => a + b, 0) /
					completenessPercents.length
				: 0;

		const total = allFields.length;
		const correctedCount = allFields.filter(
			(f: (typeof allFields)[number]) => f.wasCorrected,
		).length;

		const sectionMap: Record<string, { corrected: number; total: number }> = {};
		for (const field of allFields) {
			if (!sectionMap[field.section]) {
				sectionMap[field.section] = { corrected: 0, total: 0 };
			}
			sectionMap[field.section].total++;
			if (field.wasCorrected) {
				sectionMap[field.section].corrected++;
			}
		}

		return {
			totalCases,
			avgExtractionConfidence,
			extractionConfidenceIsLegacyEstimate,
			avgFormCompleteness,
			fieldsCorrected: { count: correctedCount, total },
			docsProcessed,
			correctionsBySection: sectionMap,
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

export default async function MetricsPage() {
	const metrics = await getMetrics();

	return (
		<div>
			<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Metrics</h1>
			<p className="mb-6 text-sm text-muted-foreground sm:text-base">
				Extraction confidence, form completeness, and correction tracking
			</p>

			<MetricsDashboard data={metrics} />
		</div>
	);
}
