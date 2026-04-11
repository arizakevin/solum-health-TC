"use client";

import { Suspense } from "react";
import { UploadContent } from "./upload-content";

export default function UploadPage() {
	return (
		<div>
			<p className="text-sm text-muted-foreground">Upload Documents</p>
			<h1 className="text-3xl font-bold tracking-tight">Upload</h1>
			<p className="mb-6 text-muted-foreground">
				Drag and drop or browse files to upload
			</p>

			<Suspense
				fallback={
					<div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
						Loading...
					</div>
				}
			>
				<UploadContent />
			</Suspense>
		</div>
	);
}
