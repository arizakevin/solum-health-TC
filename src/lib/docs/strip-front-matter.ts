/** Remove a leading YAML block so README-style front matter does not render as a heading. */
export function stripYamlFrontMatter(markdown: string): string {
	if (!markdown.startsWith("---\n")) {
		return markdown;
	}
	const end = markdown.indexOf("\n---\n", 4);
	if (end === -1) {
		return markdown;
	}
	return markdown.slice(end + 5);
}
