import { PulseBlock } from "@/components/app-loading-pulse";

export default function CasePdfRouteLoading() {
	return (
		<div
			role="status"
			aria-live="polite"
			className="flex h-[calc(100vh-5rem)] min-h-0 flex-col"
		>
			<span className="sr-only">Loading page</span>
			<div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
				<div className="min-w-0 space-y-2">
					<PulseBlock className="h-3 w-56 max-w-full" />
					<PulseBlock className="h-7 w-48 max-w-full" />
				</div>
				<div className="flex flex-wrap items-center gap-1.5">
					<PulseBlock className="h-7 w-24 rounded-md" />
					<PulseBlock className="h-7 w-24 rounded-md" />
					<PulseBlock className="h-7 w-20 rounded-md" />
					<PulseBlock className="h-7 w-24 rounded-md" />
				</div>
			</div>
			<div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-lg border bg-muted/20 p-8">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
				<PulseBlock className="h-4 w-40" />
			</div>
		</div>
	);
}
