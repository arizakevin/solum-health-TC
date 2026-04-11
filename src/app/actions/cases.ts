"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function createCase() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("Not authenticated");

	let dbUser = await prisma.user.findUnique({ where: { id: user.id } });
	if (!dbUser) {
		dbUser = await prisma.user.create({
			data: {
				id: user.id,
				email: user.email!,
				fullName: user.user_metadata?.full_name ?? null,
			},
		});
	}

	const newCase = await prisma.case.create({
		data: {
			userId: user.id,
			status: "Draft",
		},
	});

	revalidatePath("/");
	return newCase.id;
}

export async function uploadDocument(caseId: string, formData: FormData) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("Not authenticated");

	const file = formData.get("file") as File;
	if (!file) throw new Error("No file provided");

	const storagePath = `${user.id}/${caseId}/${Date.now()}-${file.name}`;

	const { error: uploadError } = await supabase.storage
		.from("documents")
		.upload(storagePath, file, {
			contentType: file.type,
			upsert: false,
		});

	if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

	const doc = await prisma.document.create({
		data: {
			caseId,
			filename: file.name,
			storagePath,
			contentType: file.type,
		},
	});

	revalidatePath("/");
	return doc.id;
}

export async function updateCaseStatus(caseId: string, status: string) {
	await prisma.case.update({
		where: { id: caseId },
		data: { status },
	});
	revalidatePath("/");
	revalidatePath(`/case/${caseId}`);
}

export async function deleteDocument(documentId: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("Not authenticated");

	const doc = await prisma.document.findUnique({
		where: { id: documentId },
		include: { case: { select: { userId: true, id: true } } },
	});

	if (!doc || doc.case.userId !== user.id) {
		throw new Error("Document not found");
	}

	const { error } = await supabase.storage
		.from("documents")
		.remove([doc.storagePath]);
	if (error) {
		console.error("Storage delete failed:", error.message);
	}

	await prisma.document.delete({ where: { id: documentId } });

	revalidatePath("/");
	revalidatePath(`/case/${doc.case.id}`);
}

export async function deleteCases(caseIds: string[]) {
	if (caseIds.length === 0) return;

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("Not authenticated");

	const cases = await prisma.case.findMany({
		where: { id: { in: caseIds }, userId: user.id },
		include: { documents: { select: { storagePath: true } } },
	});

	const paths = cases.flatMap((c) => c.documents.map((d) => d.storagePath));
	if (paths.length > 0) {
		const { error } = await supabase.storage.from("documents").remove(paths);
		if (error) {
			console.error("Bulk storage cleanup failed:", error.message);
		}
	}

	await prisma.case.deleteMany({
		where: { id: { in: cases.map((c) => c.id) } },
	});

	revalidatePath("/");
}

export async function deleteCase(caseId: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("Not authenticated");

	const existing = await prisma.case.findFirst({
		where: { id: caseId, userId: user.id },
		include: { documents: true },
	});

	if (!existing) throw new Error("Case not found");

	const paths = existing.documents.map((d) => d.storagePath);
	if (paths.length > 0) {
		const { error } = await supabase.storage.from("documents").remove(paths);
		if (error) {
			console.error("Storage cleanup failed:", error.message);
		}
	}

	await prisma.case.delete({ where: { id: caseId } });

	revalidatePath("/");
	revalidatePath(`/case/${caseId}`);
}
