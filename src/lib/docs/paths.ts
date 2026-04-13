import fs from "node:fs";
import path from "node:path";

const DOCS_DIR_NAME = "docs";

export function getDocsRoot(): string {
	return path.join(process.cwd(), DOCS_DIR_NAME);
}

function isInsideDocs(resolvedAbs: string): boolean {
	const docsAbs = path.resolve(getDocsRoot());
	const fileAbs = path.resolve(resolvedAbs);
	const rel = path.relative(docsAbs, fileAbs);
	return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

/**
 * Map URL segments (no `.md`) to a file under `docs/`.
 * `[]` → `docs/README.md`. Tries `foo.md` then `foo/README.md`.
 */
export function resolveDocFile(
	segments: string[],
): { abs: string; relFromDocs: string } | null {
	const docsRoot = getDocsRoot();
	const candidates: string[] = [];

	if (segments.length === 0) {
		candidates.push(path.join(docsRoot, "README.md"));
	} else {
		const joined = segments.join(path.sep);
		candidates.push(path.join(docsRoot, `${joined}.md`));
		candidates.push(path.join(docsRoot, joined, "README.md"));
	}

	for (const abs of candidates) {
		if (!isInsideDocs(abs)) {
			continue;
		}
		try {
			if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
				return {
					abs,
					relFromDocs: path.relative(docsRoot, abs).replace(/\\/g, "/"),
				};
			}
		} catch {
			// ignore missing or unreadable candidate
		}
	}
	return null;
}
