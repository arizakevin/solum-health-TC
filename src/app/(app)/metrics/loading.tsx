import { PulseBlock } from "@/components/app-loading-pulse";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const METRIC_CARD_KEYS = ["m1", "m2", "m3", "m4", "m5"] as const;
const SECTION_ROW_KEYS = [
	"s1",
	"s2",
	"s3",
	"s4",
	"s5",
	"s6",
	"s7",
	"s8",
] as const;
const CORRECTION_ROW_KEYS = ["c1", "c2", "c3", "c4"] as const;

function MetricCardSkeleton() {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<PulseBlock className="h-4 w-28" />
				<PulseBlock className="h-4 w-4 shrink-0 rounded" />
			</CardHeader>
			<CardContent>
				<PulseBlock className="mb-2 h-8 w-20" />
				<PulseBlock className="h-3 w-full max-w-[11rem]" />
			</CardContent>
		</Card>
	);
}

export default function MetricsRouteLoading() {
	return (
		<div role="status" aria-live="polite">
			<span className="sr-only">Loading page</span>
			<PulseBlock className="h-8 w-36 max-w-full sm:h-9" />
			<PulseBlock className="mt-2 mb-6 h-4 w-full max-w-xl" />

			<div className="space-y-6">
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
					{METRIC_CARD_KEYS.map((id) => (
						<MetricCardSkeleton key={id} />
					))}
				</div>

				<Card>
					<CardHeader>
						<PulseBlock className="h-5 w-56" />
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{SECTION_ROW_KEYS.map((id) => (
								<div key={id} className="space-y-1">
									<div className="flex items-center justify-between gap-2">
										<PulseBlock className="h-4 w-36" />
										<PulseBlock className="h-4 w-24 shrink-0" />
									</div>
									<PulseBlock className="h-2 w-full rounded-full" />
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<PulseBlock className="h-5 w-44" />
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="hidden md:table-cell">
											<PulseBlock className="h-3 w-10" />
										</TableHead>
										<TableHead>
											<PulseBlock className="h-3 w-12" />
										</TableHead>
										<TableHead>
											<PulseBlock className="h-3 w-16" />
										</TableHead>
										<TableHead>
											<PulseBlock className="h-3 w-20" />
										</TableHead>
										<TableHead className="hidden sm:table-cell">
											<PulseBlock className="h-3 w-16" />
										</TableHead>
										<TableHead className="hidden md:table-cell">
											<PulseBlock className="h-3 w-10" />
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{CORRECTION_ROW_KEYS.map((id) => (
										<TableRow key={id}>
											<TableCell className="hidden md:table-cell">
												<PulseBlock className="h-3 w-20" />
											</TableCell>
											<TableCell>
												<PulseBlock className="h-4 w-28" />
											</TableCell>
											<TableCell>
												<PulseBlock className="h-3 w-24 max-w-[120px]" />
											</TableCell>
											<TableCell>
												<PulseBlock className="h-3 w-24 max-w-[120px]" />
											</TableCell>
											<TableCell className="hidden sm:table-cell">
												<PulseBlock className="h-6 w-28 rounded-full" />
											</TableCell>
											<TableCell className="hidden md:table-cell">
												<PulseBlock className="h-3 w-14" />
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
