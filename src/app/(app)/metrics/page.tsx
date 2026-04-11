import { MetricsDashboard } from "@/components/metrics-dashboard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getMetrics() {
	try {
		const totalCases = await prisma.case.count();
		const docsProcessed = await prisma.document.count();
		const allFields = await prisma.extractionField.findMany();
		const correctedFields = await prisma.extractionField.findMany({
			where: { wasCorrected: true },
			include: { case: true },
			orderBy: { extractedAt: "desc" },
			take: 20,
		});

		const total = allFields.length;
		const correctedCount = allFields.filter(
			(f: (typeof allFields)[number]) => f.wasCorrected,
		).length;

		const highCount = allFields.filter(
			(f: (typeof allFields)[number]) => f.confidence === "high",
		).length;
		const medCount = allFields.filter(
			(f: (typeof allFields)[number]) => f.confidence === "medium",
		).length;
		const lowCount = total - highCount - medCount;
		const avgConfidence =
			total > 0 ? (highCount * 95 + medCount * 78 + lowCount * 45) / total : 0;

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

		const recentCorrections = correctedFields.map((f: (typeof correctedFields)[number]) => ({
			caseId: f.caseId,
			field: f.fieldName,
			originalValue: f.autoValue ?? "",
			correctedValue: f.finalValue ?? "",
			section: f.section,
			date: f.extractedAt,
		}));

		return {
			totalCases,
			avgConfidence,
			fieldsCorrected: { count: correctedCount, total },
			docsProcessed,
			correctionsBySection: sectionMap,
			recentCorrections,
		};
	} catch {
		return {
			totalCases: 0,
			avgConfidence: 0,
			fieldsCorrected: { count: 0, total: 0 },
			docsProcessed: 0,
			correctionsBySection: {},
			recentCorrections: [],
		};
	}
}

export default async function MetricsPage() {
	const metrics = await getMetrics();

	return (
		<div>
			<p className="text-sm text-muted-foreground">Extraction Metrics</p>
			<h1 className="text-3xl font-bold tracking-tight">Metrics</h1>
			<p className="mb-6 text-muted-foreground">
				Extraction accuracy and correction tracking
			</p>

			<MetricsDashboard data={metrics} />
		</div>
	);
}
