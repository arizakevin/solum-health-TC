/** Pure URL helpers — safe to import from client components (no `node:fs`). */

export function docRelPathToHref(relFromDocs: string): string {
	const posix = relFromDocs.replace(/\\/g, "/");
	if (posix === "README.md") {
		return "/docs";
	}
	if (posix.endsWith("/README.md")) {
		const dir = posix.slice(0, -"/README.md".length);
		return dir ? `/docs/${dir}` : "/docs";
	}
	if (posix.endsWith(".md")) {
		return `/docs/${posix.slice(0, -3)}`;
	}
	return `/docs/${posix}`;
}

export function getDocsGithubFileUrl(relFromDocsPosix: string): string {
	const base =
		process.env.NEXT_PUBLIC_DOCS_GITHUB_BASE?.replace(/\/$/, "") ??
		"https://github.com/arizakevin/solum-health-TC/blob/main/docs";
	const suffix = relFromDocsPosix.split("/").map(encodeURIComponent).join("/");
	return `${base}/${suffix}`;
}
