import { ExternalLink } from "lucide-react";
import { getDocsGithubFileUrl } from "@/lib/docs/doc-href";

type DocsGithubBannerProps = {
	relFromDocs: string;
	children?: React.ReactNode;
};

export function DocsGithubBanner({
	relFromDocs,
	children,
}: DocsGithubBannerProps) {
	const url = getDocsGithubFileUrl(relFromDocs);
	return (
		<div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
			<span>
				This page is rendered from the same Markdown files under{" "}
				<code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
					docs/
				</code>{" "}
				as on GitHub.
			</span>
			<div className="flex items-center gap-4">
				<a
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex shrink-0 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
				>
					View on GitHub
					<ExternalLink className="size-3.5" aria-hidden />
				</a>
				{children}
			</div>
		</div>
	);
}
