import { docRelPathToHref } from "@/lib/docs/doc-href";

export type DocNavItem = { label: string; relFromDocs: string };

export type DocNavGroup = {
	title: string;
	items: DocNavItem[];
};

/** Curated sidebar mirroring `docs/README.md` — same files as on GitHub. */
export const DOCS_SIDEBAR: DocNavGroup[] = [
	{
		title: "Overview",
		items: [{ label: "Documentation index", relFromDocs: "README.md" }],
	},
	{
		title: "Product and architecture",
		items: [
			{ label: "Implementation plan", relFromDocs: "implementation-plan.md" },
			{ label: "Wireframes", relFromDocs: "wireframes/README.md" },
		],
	},
	{
		title: "AI, extraction, and quality",
		items: [
			{ label: "LLM model decisions", relFromDocs: "llm-model-decisions.md" },
			{
				label: "Extraction confidence",
				relFromDocs: "extraction-confidence.md",
			},
			{ label: "Document AI OCR", relFromDocs: "document-ai-ocr.md" },
		],
	},
	{
		title: "Challenge and journal",
		items: [
			{
				label: "Technical challenge prompt",
				relFromDocs: "technical-challenge-master-prompt.md",
			},
			{ label: "Dev log", relFromDocs: "DEVLOG.md" },
		],
	},
	{
		title: "Development",
		items: [
			{ label: "AI tooling", relFromDocs: "ai-tooling.md" },
			{ label: "Agent rules and skills", relFromDocs: "agent/README.md" },
		],
	},
];

/** Flattened sidebar order — used for prev/next pager; matches `DOCS_SIDEBAR` order. */
export function docsNavOrder(): readonly DocNavItem[] {
	return DOCS_SIDEBAR.flatMap((group) => group.items);
}

export function docsNavNeighbors(relFromDocs: string): {
	prev?: DocNavItem;
	next?: DocNavItem;
} {
	const list = docsNavOrder();
	const i = list.findIndex((item) => item.relFromDocs === relFromDocs);
	if (i < 0) {
		return {};
	}
	return {
		prev: i > 0 ? list[i - 1] : undefined,
		next: i < list.length - 1 ? list[i + 1] : undefined,
	};
}

export function navHref(relFromDocs: string): string {
	return docRelPathToHref(relFromDocs);
}
