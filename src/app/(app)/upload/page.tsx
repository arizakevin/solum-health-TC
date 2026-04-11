"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createCase } from "@/app/actions/cases";
import { UploadDropzone } from "@/components/upload-dropzone";

export default function UploadPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [caseId, setCaseId] = useState<string | null>(
		searchParams.get("caseId"),
	);
	const [isCreating, setIsCreating] = useState(false);

	useEffect(() => {
		if (!caseId && !isCreating) {
			setIsCreating(true);
			createCase().then((id) => {
				setCaseId(id);
				window.history.replaceState(null, "", `/upload?caseId=${id}`);
				setIsCreating(false);
			});
		}
	}, [caseId, isCreating]);

	async function handleExtract() {
		if (!caseId) return;
		router.push(`/case/${caseId}`);
	}

	return (
		<div>
			<p className="text-sm text-muted-foreground">Upload Documents</p>
			<h1 className="text-3xl font-bold tracking-tight">Upload</h1>
			<p className="mb-6 text-muted-foreground">
				Drag and drop or browse files to upload
			</p>

			{caseId ? (
				<UploadDropzone caseId={caseId} onAllUploaded={handleExtract} />
			) : (
				<div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
					Creating case...
				</div>
			)}
		</div>
	);
}
