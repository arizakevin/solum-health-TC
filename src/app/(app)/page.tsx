import { Plus } from "lucide-react";
import Link from "next/link";
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

		return cases.map((c) => {
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
			<div className="mb-6 flex items-center justify-between">
				<div>
					<p className="text-sm text-muted-foreground">
						Dashboard / <span className="font-medium">Case List</span>
					</p>
					<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
					<p className="text-muted-foreground">Your service request cases</p>
				</div>
				<Link href="/upload">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						New Case
					</Button>
				</Link>
			</div>

			<CaseListTable cases={cases} />
		</div>
	);
}
