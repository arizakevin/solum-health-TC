import { DocsSidebar } from "@/components/docs/docs-sidebar";

export default function DocsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
			<DocsSidebar />
			<div className="min-w-0 flex-1">{children}</div>
		</div>
	);
}
