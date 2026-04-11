import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
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

			<div className="rounded-lg border">
				<div className="p-8 text-center text-muted-foreground">
					No cases yet. Create your first case to get started.
				</div>
			</div>
		</div>
	);
}
