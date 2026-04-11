export default function MetricsPage() {
	return (
		<div>
			<p className="text-sm text-muted-foreground">Extraction Metrics</p>
			<h1 className="text-3xl font-bold tracking-tight">Metrics</h1>
			<p className="text-muted-foreground">
				Extraction accuracy and correction tracking
			</p>

			<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{[
					"Total Cases",
					"Avg Confidence",
					"Fields Corrected",
					"Docs Processed",
				].map((label) => (
					<div
						key={label}
						className="flex h-24 items-center justify-center rounded-lg border text-muted-foreground"
					>
						{label} — Phase 2f
					</div>
				))}
			</div>
		</div>
	);
}
