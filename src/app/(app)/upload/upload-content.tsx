"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createCase } from "@/app/actions/cases";
import { UploadDropzone } from "@/components/upload-dropzone";

export function UploadContent() {
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

	function handleDone() {
		if (!caseId) return;
		router.push(`/case/${caseId}?extract=1`);
	}

	if (!caseId) {
		return (
			<div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
				Creating case...
			</div>
		);
	}

	return <UploadDropzone caseId={caseId} onAllUploaded={handleDone} />;
}
