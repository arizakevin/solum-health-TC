export default async function CaseReviewPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	return (
		<div>
			<p className="text-sm text-muted-foreground">
				Case Review / <span className="font-medium">#{id}</span>
			</p>
			<h1 className="text-3xl font-bold tracking-tight">Case Review</h1>

			<div className="mt-6 grid gap-6 lg:grid-cols-2">
				<div className="flex h-96 items-center justify-center rounded-lg border text-muted-foreground">
					Source Documents Panel — Phase 2d
				</div>
				<div className="flex h-96 items-center justify-center rounded-lg border text-muted-foreground">
					Service Request Form — Phase 2d
				</div>
			</div>
		</div>
	);
}
