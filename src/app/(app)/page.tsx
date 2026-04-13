import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { PaginatedCases } from "@/app/actions/cases";
import { createCase, getCasesPage } from "@/app/actions/cases";
import { DashboardClient } from "@/components/dashboard-client";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const emptyCases: PaginatedCases = {
	cases: [],
	total: 0,
	page: 1,
	pageSize: 20,
	pageCount: 1,
};

async function loadCases(): Promise<PaginatedCases> {
	try {
		return await getCasesPage({}, 1, 20);
	} catch (err: unknown) {
		const e = err as Error & { code?: string; meta?: unknown };
		console.error("[Dashboard] getCasesPage failed:", {
			name: e.name,
			message: e.message,
			code: e.code,
			meta: e.meta,
			stack: e.stack?.split("\n").slice(0, 6).join("\n"),
		});
		return emptyCases;
	}
}

export default async function DashboardPage() {
	const initialData = await loadCases();

	return (
		<div>
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
						Dashboard
					</h1>
					<p className="text-sm text-muted-foreground sm:text-base">
						Your prior authorization cases
					</p>
				</div>
				<form
					action={async () => {
						"use server";
						const id = await createCase();
						redirect(`/case/${id}`);
					}}
				>
					<Button id="btn-new-case" type="submit">
						<Plus className="mr-2 h-4 w-4" />
						New Case
					</Button>
				</form>
			</div>

			<Suspense>
				<DashboardClient initialData={initialData} />
			</Suspense>
		</div>
	);
}
