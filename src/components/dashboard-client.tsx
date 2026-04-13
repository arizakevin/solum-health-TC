"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	type CaseFilters,
	deleteCases,
	getCasesPage,
	type PaginatedCases,
} from "@/app/actions/cases";
import { DeleteCaseButton } from "@/components/delete-case-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const STATUS_OPTIONS = ["All", "Draft", "In Review", "Extracting", "Completed"];
const PAGE_SIZES = [10, 20, 50] as const;

function statusVariant(
	status: string,
): "default" | "secondary" | "outline" | "destructive" {
	switch (status) {
		case "Completed":
			return "default";
		case "In Review":
			return "secondary";
		case "Extracting":
			return "outline";
		default:
			return "outline";
	}
}

export function DashboardClient({
	initialData,
}: {
	initialData: PaginatedCases;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();

	const [search, setSearch] = useState(searchParams.get("search") ?? "");
	const [status, setStatus] = useState(searchParams.get("status") ?? "All");
	const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") ?? "");
	const [dateTo, setDateTo] = useState(searchParams.get("dateTo") ?? "");
	const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
	const [pageSize, setPageSize] = useState(
		(Number(searchParams.get("pageSize")) as (typeof PAGE_SIZES)[number]) || 20,
	);

	const debouncedSearch = useDebounce(search, 300);

	const filters: CaseFilters = {
		search: debouncedSearch || undefined,
		status: status !== "All" ? status : undefined,
		dateFrom: dateFrom || undefined,
		dateTo: dateTo || undefined,
	};

	const { data, isFetching } = useQuery({
		queryKey: ["cases", filters, page, pageSize],
		queryFn: () => getCasesPage(filters, page, pageSize),
		initialData:
			page === 1 && !debouncedSearch && status === "All" && !dateFrom && !dateTo
				? initialData
				: undefined,
		placeholderData: (prev) => prev,
	});

	const result = data ?? initialData;
	const cases = result.cases;

	useEffect(() => {
		const params = new URLSearchParams();
		if (debouncedSearch) params.set("search", debouncedSearch);
		if (status !== "All") params.set("status", status);
		if (dateFrom) params.set("dateFrom", dateFrom);
		if (dateTo) params.set("dateTo", dateTo);
		if (page > 1) params.set("page", String(page));
		if (pageSize !== 20) params.set("pageSize", String(pageSize));

		const qs = params.toString();
		const url = qs ? `/?${qs}` : "/";
		window.history.replaceState(null, "", url);
	}, [debouncedSearch, status, dateFrom, dateTo, page, pageSize]);

	// Reset to page 1 when filters change
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset page on filter change
	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, status, dateFrom, dateTo, pageSize]);

	// Selection state
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [showBulkConfirm, setShowBulkConfirm] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const allSelected = cases.length > 0 && selected.size === cases.length;
	const someSelected = selected.size > 0;

	function toggleOne(id: string) {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function toggleAll() {
		setSelected(allSelected ? new Set() : new Set(cases.map((c) => c.id)));
	}

	async function handleBulkDelete() {
		setIsDeleting(true);
		try {
			const count = selected.size;
			await deleteCases([...selected]);
			setSelected(new Set());
			setShowBulkConfirm(false);
			await queryClient.invalidateQueries({ queryKey: ["cases"] });
			router.refresh();
			toast.success(count === 1 ? "Case deleted" : `${count} cases deleted`);
		} catch (err) {
			console.error("Bulk delete failed:", err);
			const message =
				err instanceof Error ? err.message : "Could not delete selected cases";
			toast.error(message);
		} finally {
			setIsDeleting(false);
		}
	}

	function clearFilters() {
		setSearch("");
		setStatus("All");
		setDateFrom("");
		setDateTo("");
		setPage(1);
	}

	const hasActiveFilters =
		!!debouncedSearch || status !== "All" || !!dateFrom || !!dateTo;

	const controlH =
		"h-11 min-h-[44px] py-0 text-base leading-none sm:h-8 sm:min-h-8 sm:text-sm";

	return (
		<div id="case-list-table" className="space-y-4">
			{/* Filters: stacked + 44px touch targets on mobile; compact row from sm */}
			<div className="rounded-xl border border-border/60 bg-muted/15 p-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
				<p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:sr-only">
					Filters
				</p>
				<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
					<div className="relative w-full sm:min-w-[180px] sm:max-w-xs sm:flex-1">
						<Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground sm:left-2.5 sm:size-3.5" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search patient name…"
							className={`w-full pl-10 sm:pl-8 ${controlH}`}
							autoComplete="off"
						/>
					</div>

					<Select value={status} onValueChange={(v) => setStatus(v ?? "All")}>
						<SelectTrigger
							className={`w-full shrink-0 sm:w-[130px] ${controlH}`}
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{STATUS_OPTIONS.map((s) => (
								<SelectItem key={s} value={s}>
									{s}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<div className="grid w-full grid-cols-2 gap-2 sm:contents">
						<div className="min-w-0 space-y-1 sm:space-y-0">
							<span className="block text-xs text-muted-foreground sm:sr-only">
								Created from
							</span>
							<Input
								type="date"
								value={dateFrom}
								onChange={(e) => setDateFrom(e.target.value)}
								className={`w-full min-w-0 sm:w-[140px] sm:shrink-0 ${controlH}`}
								aria-label="Created from date"
							/>
						</div>
						<div className="min-w-0 space-y-1 sm:space-y-0">
							<span className="block text-xs text-muted-foreground sm:sr-only">
								Created to
							</span>
							<Input
								type="date"
								value={dateTo}
								onChange={(e) => setDateTo(e.target.value)}
								className={`w-full min-w-0 sm:w-[140px] sm:shrink-0 ${controlH}`}
								aria-label="Created to date"
							/>
						</div>
					</div>

					<div className="flex items-center justify-end gap-2 sm:contents">
						{hasActiveFilters && (
							<Button
								variant="outline"
								type="button"
								size="sm"
								onClick={clearFilters}
								className="h-11 min-h-[44px] flex-1 px-3 text-sm sm:h-8 sm:min-h-8 sm:w-auto sm:flex-initial sm:px-2 sm:text-xs"
							>
								<X className="mr-1.5 size-4 sm:mr-1 sm:size-3" />
								Clear filters
							</Button>
						)}
						{isFetching && (
							<div
								className="flex size-11 shrink-0 items-center justify-center sm:size-8"
								aria-hidden
							>
								<div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent sm:size-4" />
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Bulk selection bar */}
			{someSelected && (
				<div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
					<span className="text-sm font-medium">
						{selected.size} case{selected.size !== 1 ? "s" : ""} selected
					</span>
					<Button
						variant="destructive"
						size="sm"
						onClick={() => setShowBulkConfirm(true)}
					>
						<Trash2 className="mr-1.5 h-3.5 w-3.5" />
						Delete selected
					</Button>
					<button
						type="button"
						onClick={() => setSelected(new Set())}
						className="ml-auto text-xs text-muted-foreground hover:text-foreground"
					>
						Clear selection
					</button>
				</div>
			)}

			{/* Table or empty state */}
			{cases.length === 0 ? (
				<div className="rounded-lg border p-8 text-center text-muted-foreground">
					{hasActiveFilters
						? "No cases match the current filters."
						: "No cases yet. Create your first case to get started."}
				</div>
			) : (
				<div className="overflow-x-auto rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-10 pl-4 pr-0">
									<input
										type="checkbox"
										checked={allSelected}
										onChange={toggleAll}
										className="h-3.5 w-3.5 accent-primary"
										aria-label="Select all cases"
									/>
								</TableHead>
								<TableHead className="hidden md:table-cell">Case ID</TableHead>
								<TableHead>Patient Name</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Documents</TableHead>
								<TableHead className="hidden md:table-cell">Created</TableHead>
								<TableHead className="min-w-44 text-right whitespace-nowrap">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{cases.map((c) => (
								<TableRow
									key={c.id}
									data-state={selected.has(c.id) ? "selected" : undefined}
									className="cursor-pointer"
									title="Open case"
									onClick={() => router.push(`/case/${c.id}`)}
								>
									<TableCell
										className="pl-4 pr-0"
										onClick={(e) => e.stopPropagation()}
									>
										<input
											type="checkbox"
											checked={selected.has(c.id)}
											onChange={() => toggleOne(c.id)}
											className="h-3.5 w-3.5 accent-primary"
											aria-label={`Select case #${c.id.slice(0, 8)}`}
										/>
									</TableCell>
									<TableCell className="hidden font-mono text-xs md:table-cell">
										#{c.id.slice(0, 8)}
									</TableCell>
									<TableCell>
										<Link
											href={`/case/${c.id}`}
											className="text-foreground underline-offset-4 hover:underline"
											onClick={(e) => e.stopPropagation()}
										>
											{c.patientName ?? "—"}
										</Link>
									</TableCell>
									<TableCell>
										<Badge variant={statusVariant(c.status)}>{c.status}</Badge>
									</TableCell>
									<TableCell>
										{c.documentCount} doc
										{c.documentCount !== 1 ? "s" : ""}
									</TableCell>
									<TableCell className="hidden md:table-cell">
										{new Date(c.createdAt).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
										})}
									</TableCell>
									<TableCell
										className="text-right whitespace-nowrap"
										onClick={(e) => e.stopPropagation()}
									>
										<div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1">
											{c.status === "Completed" && (
												<Link
													href={`/case/${c.id}/pdf`}
													className="text-sm font-medium text-primary underline-offset-4 hover:underline"
												>
													View PDF
												</Link>
											)}
											<DeleteCaseButton
												caseId={c.id}
												caseDisplayId={`#${c.id.slice(0, 8)}`}
												variant="link"
												className="shrink-0"
											/>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Pagination controls */}
			{result.pageCount > 1 && (
				<div className="flex flex-wrap items-center justify-between gap-2 text-sm">
					<p className="text-xs text-muted-foreground">
						{(result.page - 1) * result.pageSize + 1}–
						{Math.min(result.page * result.pageSize, result.total)} of{" "}
						{result.total}
					</p>

					<div className="flex items-center gap-2">
						<Select
							value={String(pageSize)}
							onValueChange={(v) =>
								v && setPageSize(Number(v) as (typeof PAGE_SIZES)[number])
							}
						>
							<SelectTrigger className="w-[70px]" size="sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PAGE_SIZES.map((s) => (
									<SelectItem key={s} value={String(s)}>
										{s}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="icon-xs"
								disabled={page <= 1}
								onClick={() => setPage((p) => p - 1)}
								aria-label="Previous page"
							>
								<ChevronLeft className="h-3.5 w-3.5" />
							</Button>
							<span className="px-2 text-xs text-muted-foreground">
								{result.page} / {result.pageCount}
							</span>
							<Button
								variant="outline"
								size="icon-xs"
								disabled={page >= result.pageCount}
								onClick={() => setPage((p) => p + 1)}
								aria-label="Next page"
							>
								<ChevronRight className="h-3.5 w-3.5" />
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Bulk delete dialog */}
			<Dialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
				<DialogContent className="sm:max-w-md" showCloseButton>
					<DialogHeader>
						<DialogTitle>
							Delete {selected.size} case{selected.size !== 1 ? "s" : ""}?
						</DialogTitle>
						<DialogDescription>
							This will permanently delete the selected cases, their documents,
							and all extraction data. This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<DialogClose render={<Button variant="outline" type="button" />}>
							Cancel
						</DialogClose>
						<Button
							type="button"
							variant="destructive"
							disabled={isDeleting}
							onClick={handleBulkDelete}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							{isDeleting
								? "Deleting..."
								: `Delete ${selected.size} case${selected.size !== 1 ? "s" : ""}`}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function useDebounce<T>(value: T, delay: number): T {
	const [debounced, setDebounced] = useState(value);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => {
		timer.current = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer.current);
	}, [value, delay]);

	return debounced;
}
