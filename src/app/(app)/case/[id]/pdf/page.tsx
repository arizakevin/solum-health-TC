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
		<div className="flex h-[calc(100vh-5rem)] flex-col">
			<div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
				<div className="min-w-0">
					<p className="text-xs text-muted-foreground">
						Case Review /{" "}
						<span className="font-medium">#{caseId.slice(0, 8)}</span> / PDF
					</p>
					<h1 className="text-xl font-bold tracking-tight">Generated PDF</h1>
				</div>
				<div className="flex flex-wrap items-center gap-1.5">
					<Link href={`/case/${caseId}`}>
						<Button variant="outline" size="xs">
							<ArrowLeft className="mr-1.5 h-3 w-3" />
							<span className="hidden sm:inline">Back to Case</span>
							<span className="sm:hidden">Back</span>
						</Button>
					</Link>
					<Button
						variant="outline"
						size="xs"
						onClick={handleDownload}
						disabled={!pdfUrl}
					>
						<Download className="mr-1.5 h-3 w-3" />
						<span className="hidden sm:inline">Download</span>
					</Button>
					<Button
						variant="outline"
						size="xs"
						onClick={handlePrint}
						disabled={!pdfUrl}
					>
						<Printer className="mr-1.5 h-3 w-3" />
						<span className="hidden sm:inline">Print</span>
					</Button>
					<Button variant="outline" size="xs" onClick={generatePdf}>
						<RefreshCw className="mr-1.5 h-3 w-3" />
						<span className="hidden sm:inline">Regenerate</span>
					</Button>
				</div>
			</div>

			<div className="min-h-0 flex-1 rounded-lg border bg-muted/20">
				{isLoading ? (
					<div className="flex h-full items-center justify-center">
						<div className="text-center">
							<div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
							<p className="text-sm text-muted-foreground">Generating PDF...</p>
						</div>
					</div>
				) : error ? (
					<div className="flex h-full items-center justify-center">
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
						className="h-full w-full rounded-lg"
						title="Generated PDF"
					/>
				) : null}
			</div>
		</div>
	);
}
