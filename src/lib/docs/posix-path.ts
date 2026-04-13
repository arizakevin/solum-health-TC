/** Browser-safe path helpers (POSIX) for resolving markdown links. */

export function posixDirname(p: string): string {
	const n = p.replace(/\\/g, "/");
	const i = n.lastIndexOf("/");
	if (i <= 0) {
		return "";
	}
	return n.slice(0, i);
}

export function posixNormalizeDotPath(p: string): string {
	const parts = p.replace(/\\/g, "/").split("/").filter(Boolean);
	const stack: string[] = [];
	for (const part of parts) {
		if (part === ".") {
			continue;
		}
		if (part === "..") {
			stack.pop();
		} else {
			stack.push(part);
		}
	}
	return stack.join("/");
}

export function posixJoin(baseDir: string, rel: string): string {
	const r = rel.replace(/\\/g, "/");
	if (!baseDir) {
		return posixNormalizeDotPath(r);
	}
	return posixNormalizeDotPath(`${baseDir.replace(/\/$/, "")}/${r}`);
}
