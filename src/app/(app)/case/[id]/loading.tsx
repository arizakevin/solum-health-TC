import { PulseBlock } from "@/components/app-loading-pulse";

const FORM_TRIGGER_KEYS = [
	"t1",
	"t2",
	"t3",
	"t4",
	"t5",
	"t6",
	"t7",
	"t8",
] as const;

export default function CaseReviewRouteLoading() {
	return (
		<div role="status" aria-live="polite">
			<span className="sr-only">Loading page</span>
			<div className="mb-4 flex flex-wrap items-start justify-between gap-3">
				<div className="flex min-w-0 flex-wrap items-center gap-3">
					<div>
						<PulseBlock className="mb-1 h-3 w-24" />
						<div className="flex flex-wrap items-center gap-3">
							<PulseBlock className="h-8 w-36 sm:h-9" />
							<PulseBlock className="h-6 w-24 rounded-md" />
						</div>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<PulseBlock className="h-9 w-[7.5rem] rounded-lg" />
					<PulseBlock className="h-9 w-28 rounded-lg" />
				</div>
			</div>

			<div className="flex flex-col gap-3">
				<div className="flex min-h-0 w-full flex-col overflow-hidden rounded-lg ring-1 ring-foreground/10">
					<div className="flex items-center justify-between border-b px-3 py-2">
						<div className="flex items-center gap-1.5">
							<PulseBlock className="h-4 w-36" />
							<PulseBlock className="h-3.5 w-3.5 shrink-0 rounded" />
						</div>
						<PulseBlock className="h-6 w-14 rounded-md" />
					</div>
					<div className="border-b px-3 py-3">
						<div className="flex items-start gap-3">
							<PulseBlock className="mt-0.5 h-8 w-8 shrink-0 rounded" />
							<div className="min-w-0 flex-1 space-y-2">
								<PulseBlock className="h-4 w-full max-w-md" />
								<PulseBlock className="h-3 w-32" />
							</div>
						</div>
					</div>
					<div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2">
						<div className="flex flex-wrap items-center gap-2">
							<PulseBlock className="h-3 w-28" />
							<PulseBlock className="h-3 w-24" />
							<PulseBlock className="h-5 w-28 rounded-full" />
						</div>
						<div className="flex items-center gap-2">
							<PulseBlock className="h-8 w-8 rounded-md" />
							<PulseBlock className="h-8 w-28 rounded-lg" />
						</div>
					</div>
				</div>

				<div className="flex min-h-0 min-w-0 flex-col rounded-lg border bg-card text-card-foreground">
					<div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
						<PulseBlock className="h-4 w-28" />
						<div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
							<PulseBlock className="h-5 w-9 shrink-0 rounded-full" />
							<PulseBlock className="h-4 w-40 max-w-[55%]" />
						</div>
					</div>
					<div className="flex min-h-0 flex-col px-3 pt-3 pb-3">
						<div className="divide-y rounded-md border">
							{FORM_TRIGGER_KEYS.map((id) => (
								<div
									key={id}
									className="flex items-center justify-between gap-2 px-3 py-3.5"
								>
									<div className="flex min-w-0 flex-1 items-center gap-2">
										<PulseBlock className="h-4 w-48 max-w-[70%]" />
										<PulseBlock className="h-4 w-20 shrink-0 rounded" />
									</div>
									<PulseBlock className="h-4 w-4 shrink-0 rounded" />
								</div>
							))}
						</div>
						<div className="-mx-3 mt-3 flex shrink-0 flex-col gap-2 border-t px-3 pt-4 pb-0 sm:flex-row sm:justify-end">
							<PulseBlock className="h-10 w-full rounded-lg sm:w-28" />
							<PulseBlock className="h-10 w-full rounded-lg sm:min-w-56" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
