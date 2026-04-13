import fs from "node:fs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsGithubBanner } from "@/components/docs/docs-github-banner";
import { DocsMarkdown } from "@/components/docs/docs-markdown";
import { DocsPager } from "@/components/docs/docs-pager";
import { resolveDocFile } from "@/lib/docs/paths";
import { stripYamlFrontMatter } from "@/lib/docs/strip-front-matter";

function titleFromMarkdown(markdown: string): string | undefined {
	const body = stripYamlFrontMatter(markdown);
	const m = body.match(/^#\s+(.+)$/m);
	return m?.[1]?.trim();
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ path?: string[] }>;
}): Promise<Metadata> {
	const { path } = await params;
	const resolved = resolveDocFile(path ?? []);
	if (!resolved) {
		return { title: "Documentation" };
	}
	let raw = "";
	try {
		raw = fs.readFileSync(resolved.abs, "utf8");
	} catch {
		return { title: "Documentation" };
	}
	const heading = titleFromMarkdown(raw);
	return {
		title: heading ? `${heading} · Docs` : "Documentation",
	};
}

export default async function DocsPage({
	params,
}: {
	params: Promise<{ path?: string[] }>;
}) {
	const { path } = await params;
	const resolved = resolveDocFile(path ?? []);
	if (!resolved) {
		notFound();
	}

	let raw = "";
	try {
		raw = fs.readFileSync(resolved.abs, "utf8");
	} catch {
		notFound();
	}

	const content = stripYamlFrontMatter(raw);

	return (
		<div>
			<DocsGithubBanner relFromDocs={resolved.relFromDocs} />
			<DocsMarkdown content={content} docRelFromDocs={resolved.relFromDocs} />
			<DocsPager relFromDocs={resolved.relFromDocs} />
		</div>
	);
}
