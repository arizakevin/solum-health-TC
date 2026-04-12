import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { createCase } from "@/app/actions/cases";
import { CaseListTable } from "@/components/case-list-table";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getCases() {
	try {
		const cases = await prisma.case.findMany({
			orderBy: { createdAt: "desc" },
			include: {
				_count: { select: { documents: true } },
			},
		});

		return cases.map((c: (typeof cases)[number]) => {
			const formData = c.finalFormData as Record<string, unknown> | null;
			const sectionA = formData?.sectionA as
				| Record<string, { value?: string }>
				| undefined;
			const patientName = sectionA?.name?.value ?? null;

			return {
				id: c.id,
				patientName,
				status: c.status,
				documentCount: c._count.documents,
				createdAt: c.createdAt,
			};
		});
	} catch {
		return [];
	}
}

export default async function DashboardPage() {
	const cases = await getCases();

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
					<Button type="submit">
						<Plus className="mr-2 h-4 w-4" />
						New Case
					</Button>
				</form>
			</div>

			<CaseListTable cases={cases} />
		</div>
	);
}
