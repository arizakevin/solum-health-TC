"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
	if (cases.length === 0) {
		return (
			<div className="rounded-lg border p-8 text-center text-muted-foreground">
				No cases yet. Create your first case to get started.
			</div>
		);
	}

	return (
		<div className="rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Case ID</TableHead>
						<TableHead>Patient Name</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Documents</TableHead>
						<TableHead>Created</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{cases.map((c) => (
						<TableRow key={c.id}>
							<TableCell className="font-mono text-xs">
								#{c.id.slice(0, 8)}
							</TableCell>
							<TableCell>{c.patientName ?? "—"}</TableCell>
							<TableCell>
								<Badge variant={statusVariant(c.status)}>{c.status}</Badge>
							</TableCell>
							<TableCell>
								{c.documentCount} doc{c.documentCount !== 1 ? "s" : ""}
							</TableCell>
							<TableCell>
								{c.createdAt.toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
									year: "numeric",
								})}
							</TableCell>
							<TableCell>
								<Link
									href={`/case/${c.id}`}
									className="text-sm font-medium text-primary underline-offset-4 hover:underline"
								>
									View
								</Link>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
