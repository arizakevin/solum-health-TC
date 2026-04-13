import { PulseBlock } from "@/components/app-loading-pulse";

const LINE_KEYS = ["l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8"] as const;

export default function DocsRouteLoading() {
	return (
		<div role="status" aria-live="polite" className="space-y-6">
			<span className="sr-only">Loading page</span>
			<PulseBlock className="h-4 w-full max-w-xl rounded-lg" />
			<div className="space-y-3">
				<PulseBlock className="h-10 w-[min(100%,28rem)] max-w-lg" />
				{LINE_KEYS.map((id, i) => (
					<PulseBlock
						key={id}
						className={`h-3 max-w-full ${i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-[92%]" : "w-[88%]"}`}
					/>
				))}
			</div>
			<div className="flex justify-between gap-4 border-t pt-6">
				<PulseBlock className="h-4 w-32" />
				<PulseBlock className="h-4 w-32" />
			</div>
		</div>
	);
}
