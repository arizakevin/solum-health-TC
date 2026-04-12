import { getMetricsData } from "@/app/actions/metrics";
import { MetricsDashboard } from "@/components/metrics-dashboard";

export const revalidate = 60;

export default async function MetricsPage() {
	const metrics = await getMetricsData();

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
