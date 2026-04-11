export default async function PdfPreviewPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	return (
		<div>
			<p className="text-sm text-muted-foreground">
				PDF Preview / <span className="font-medium">Case #{id}</span>
			</p>
			<h1 className="text-3xl font-bold tracking-tight">PDF Preview</h1>

			<div className="mt-6 flex h-[600px] items-center justify-center rounded-lg border text-muted-foreground">
				PDF Viewer — Phase 2e
			</div>
		</div>
	);
}
