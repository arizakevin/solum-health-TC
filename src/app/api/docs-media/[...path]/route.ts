import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getDocsRoot } from "@/lib/docs/paths";
import { createClient } from "@/lib/supabase/server";

function contentTypeFor(filePath: string): string {
	const ext = path.extname(filePath).toLowerCase();
	switch (ext) {
		case ".png":
			return "image/png";
		case ".jpg":
		case ".jpeg":
			return "image/jpeg";
		case ".gif":
			return "image/gif";
		case ".webp":
			return "image/webp";
		case ".svg":
			return "image/svg+xml";
		case ".ico":
			return "image/x-icon";
		default:
			return "application/octet-stream";
	}
}

export async function GET(
	_request: Request,
	context: { params: Promise<{ path: string[] }> },
) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const { path: segments } = await context.params;
	if (!segments?.length) {
		return new NextResponse("Not found", { status: 404 });
	}

	const docsRoot = path.resolve(getDocsRoot());
	const abs = path.resolve(path.join(docsRoot, ...segments));
	const rel = path.relative(docsRoot, abs);
	if (rel.startsWith("..") || path.isAbsolute(rel)) {
		return new NextResponse("Not found", { status: 404 });
	}

	try {
		if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
			return new NextResponse("Not found", { status: 404 });
		}
	} catch {
		return new NextResponse("Not found", { status: 404 });
	}

	const body = fs.readFileSync(abs);
	return new NextResponse(body, {
		headers: {
			"Content-Type": contentTypeFor(abs),
			"Cache-Control": "public, max-age=3600",
		},
	});
}
