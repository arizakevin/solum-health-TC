import { PulseBlock } from "@/components/app-loading-pulse";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const TABLE_ROW_KEYS = [
	"r1",
	"r2",
	"r3",
	"r4",
	"r5",
	"r6",
	"r7",
	"r8",
] as const;

export default function DashboardRouteLoading() {
	return (
		<div role="status" aria-live="polite">
			<span className="sr-only">Loading page</span>
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<div>
					<PulseBlock className="h-8 w-40 max-w-full sm:h-9" />
					<PulseBlock className="mt-2 h-4 w-56 max-w-full sm:w-72" />
				</div>
				<PulseBlock className="h-10 w-32 shrink-0 rounded-lg" />
			</div>

			<div className="space-y-4">
				<div className="rounded-xl border border-border/60 bg-muted/15 p-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
					<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
						<PulseBlock className="h-11 w-full rounded-lg sm:h-8 sm:max-w-xs sm:flex-1" />
						<PulseBlock className="h-11 w-full shrink-0 rounded-lg sm:h-8 sm:w-[130px]" />
						<div className="grid w-full grid-cols-2 gap-2 sm:contents">
							<PulseBlock className="h-11 rounded-lg sm:h-8 sm:w-[140px] sm:shrink-0" />
							<PulseBlock className="h-11 rounded-lg sm:h-8 sm:w-[140px] sm:shrink-0" />
						</div>
					</div>
				</div>

				<div className="overflow-x-auto rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-10 pl-4 pr-0">
									<PulseBlock className="h-3.5 w-3.5 rounded" />
								</TableHead>
								<TableHead className="hidden md:table-cell">
									<PulseBlock className="h-3 w-16" />
								</TableHead>
								<TableHead>
									<PulseBlock className="h-3 w-24" />
								</TableHead>
								<TableHead>
									<PulseBlock className="h-3 w-14" />
								</TableHead>
								<TableHead>
									<PulseBlock className="h-3 w-20" />
								</TableHead>
								<TableHead className="hidden md:table-cell">
									<PulseBlock className="h-3 w-16" />
								</TableHead>
								<TableHead className="min-w-44 text-right">
									<PulseBlock className="ml-auto h-3 w-14" />
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{TABLE_ROW_KEYS.map((id) => (
								<TableRow key={id}>
									<TableCell className="pl-4 pr-0">
										<PulseBlock className="h-3.5 w-3.5 rounded" />
									</TableCell>
									<TableCell className="hidden md:table-cell">
										<PulseBlock className="h-3 w-24" />
									</TableCell>
									<TableCell>
										<PulseBlock className="h-4 w-36 max-w-[12rem]" />
									</TableCell>
									<TableCell>
										<PulseBlock className="h-6 w-24 rounded-full" />
									</TableCell>
									<TableCell>
										<PulseBlock className="h-3 w-12" />
									</TableCell>
									<TableCell className="hidden md:table-cell">
										<PulseBlock className="h-3 w-20" />
									</TableCell>
									<TableCell className="text-right">
										<div className="flex flex-wrap items-center justify-end gap-3">
											<PulseBlock className="h-4 w-16 rounded" />
											<PulseBlock className="h-4 w-12 rounded" />
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
