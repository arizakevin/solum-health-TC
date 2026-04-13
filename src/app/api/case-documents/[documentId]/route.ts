import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function GET(
	_request: Request,
	context: { params: Promise<{ documentId: string }> },
) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const { documentId } = await context.params;
	const doc = await prisma.document.findUnique({
		where: { id: documentId },
		include: { case: { select: { userId: true } } },
	});

	if (!doc || doc.case.userId !== user.id) {
		return new NextResponse("Not found", { status: 404 });
	}

	const { data: blob, error } = await supabase.storage
		.from("documents")
		.download(doc.storagePath);

	if (error || !blob) {
		return NextResponse.json(
			{ error: error?.message ?? "Download failed" },
			{ status: 502 },
		);
	}

	const buffer = await blob.arrayBuffer();
	const safeName = doc.filename.replace(/[\r\n"]/g, "_");

	return new NextResponse(buffer, {
		headers: {
			"Content-Type": doc.contentType || "application/octet-stream",
			"Content-Disposition": `inline; filename="${safeName}"`,
			"Cache-Control": "private, max-age=120",
		},
	});
}
