"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteCases } from "@/app/actions/cases";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface CaseRow {
	id: string;
	patientName: string | null;
	status: string;
	documentCount: number;
	createdAt: Date;
}

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

export function CaseListTable({ cases }: { cases: CaseRow[] }) {
	const router = useRouter();
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
		if (allSelected) {
			setSelected(new Set());
		} else {
			setSelected(new Set(cases.map((c) => c.id)));
		}
	}

	async function handleBulkDelete() {
		setIsDeleting(true);
		try {
			await deleteCases([...selected]);
			setSelected(new Set());
			setShowBulkConfirm(false);
			router.refresh();
		} catch (err) {
			console.error("Bulk delete failed:", err);
		} finally {
			setIsDeleting(false);
		}
	}

	if (cases.length === 0) {
		return (
			<div className="rounded-lg border p-8 text-center text-muted-foreground">
				No cases yet. Create your first case to get started.
			</div>
		);
	}

	return (
		<>
			{someSelected && (
				<div className="mb-3 flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
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

			<div className="rounded-lg border overflow-x-auto">
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
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{cases.map((c) => (
							<TableRow
								key={c.id}
								data-state={selected.has(c.id) ? "selected" : undefined}
							>
								<TableCell className="pl-4 pr-0">
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
								<TableCell>{c.patientName ?? "—"}</TableCell>
								<TableCell>
									<Badge variant={statusVariant(c.status)}>{c.status}</Badge>
								</TableCell>
								<TableCell>
									{c.documentCount} doc{c.documentCount !== 1 ? "s" : ""}
								</TableCell>
								<TableCell className="hidden md:table-cell">
									{c.createdAt.toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
										year: "numeric",
									})}
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-3">
										<Link
											href={`/case/${c.id}`}
											className="text-sm font-medium text-primary underline-offset-4 hover:underline"
										>
											View
										</Link>
										<DeleteCaseButton
											caseId={c.id}
											caseDisplayId={`#${c.id.slice(0, 8)}`}
											variant="link"
										/>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

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
		</>
	);
}
