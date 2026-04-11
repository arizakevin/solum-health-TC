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
