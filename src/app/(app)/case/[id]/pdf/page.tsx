"use client";

import { ArrowLeft, Download, Printer, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function PdfPreviewPage() {
	const params = useParams<{ id: string }>();
	const caseId = params.id;
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const generatePdf = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/generate-pdf", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ caseId }),
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error ?? "PDF generation failed");
			}

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			setPdfUrl((prev) => {
				if (prev) URL.revokeObjectURL(prev);
				return url;
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setIsLoading(false);
		}
	}, [caseId]);

	useEffect(() => {
		generatePdf();
	}, [generatePdf]);

	function handleDownload() {
		if (!pdfUrl) return;
		const a = document.createElement("a");
		a.href = pdfUrl;
		a.download = `service-request-${caseId.slice(0, 8)}.pdf`;
		a.click();
	}

	function handlePrint() {
		if (!pdfUrl) return;
		const iframe = document.createElement("iframe");
		iframe.style.display = "none";
		iframe.src = pdfUrl;
		document.body.appendChild(iframe);
		iframe.onload = () => {
			iframe.contentWindow?.print();
			setTimeout(() => document.body.removeChild(iframe), 1000);
		};
	}

	return (
		<div>
			<div className="mb-4 flex items-center gap-3">
				<div>
					<p className="text-sm text-muted-foreground">
						PDF Preview /{" "}
						<span className="font-medium">Case #{caseId.slice(0, 8)}</span>
					</p>
					<h1 className="text-3xl font-bold tracking-tight">PDF Preview</h1>
				</div>
			</div>

			<div className="mb-4 flex items-center gap-2">
				<Link href={`/case/${caseId}`}>
					<Button variant="outline" size="sm">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Case
					</Button>
				</Link>
				<Button
					variant="outline"
					size="sm"
					onClick={handleDownload}
					disabled={!pdfUrl}
				>
					<Download className="mr-2 h-4 w-4" />
					Download PDF
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={handlePrint}
					disabled={!pdfUrl}
				>
					<Printer className="mr-2 h-4 w-4" />
					Print
				</Button>
				<Button variant="outline" size="sm" onClick={generatePdf}>
					<RefreshCw className="mr-2 h-4 w-4" />
					Regenerate
				</Button>
			</div>

			<div className="rounded-lg border bg-muted/20">
				{isLoading ? (
					<div className="flex h-[700px] items-center justify-center">
						<div className="text-center">
							<div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
							<p className="text-sm text-muted-foreground">Generating PDF...</p>
						</div>
					</div>
				) : error ? (
					<div className="flex h-[700px] items-center justify-center">
						<div className="text-center text-red-500">
							<p className="font-medium">PDF Generation Failed</p>
							<p className="text-sm">{error}</p>
							<Button
								variant="outline"
								size="sm"
								className="mt-3"
								onClick={generatePdf}
							>
								Retry
							</Button>
						</div>
					</div>
				) : pdfUrl ? (
					<iframe
						src={pdfUrl}
						className="h-[700px] w-full rounded-lg"
						title="PDF Preview"
					/>
				) : null}
			</div>
		</div>
	);
}
