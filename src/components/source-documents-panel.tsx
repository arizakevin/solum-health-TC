"use client";

import { FileText, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DocumentInfo {
	id: string;
	filename: string;
	contentType: string;
	pageCount: number | null;
	uploadedAt: Date;
}

interface SourceDocumentsPanelProps {
	documents: DocumentInfo[];
	aggregateConfidence: number;
	extractionDate: Date | null;
	onReExtract: () => void;
	isExtracting: boolean;
}

export function SourceDocumentsPanel({
	documents,
	aggregateConfidence,
	extractionDate,
	onReExtract,
	isExtracting,
}: SourceDocumentsPanelProps) {
	return (
		<div className="flex h-full flex-col rounded-lg border">
			<div className="border-b p-3">
				<h2 className="text-sm font-semibold">Source Documents</h2>
			</div>

			{documents.length > 0 ? (
				<Tabs defaultValue={documents[0].id} className="flex flex-1 flex-col">
					<TabsList className="w-full justify-start rounded-none border-b px-2">
						{documents.map((doc) => (
							<TabsTrigger key={doc.id} value={doc.id} className="text-xs">
								<FileText className="mr-1 h-3 w-3" />
								{doc.filename.length > 20
									? `${doc.filename.slice(0, 20)}...`
									: doc.filename}
							</TabsTrigger>
						))}
					</TabsList>
					{documents.map((doc) => (
						<TabsContent
							key={doc.id}
							value={doc.id}
							className="flex flex-1 items-center justify-center p-4 text-muted-foreground"
						>
							<div className="text-center">
								<FileText className="mx-auto mb-2 h-12 w-12" />
								<p className="text-sm font-medium">{doc.filename}</p>
								<p className="text-xs">
									{doc.contentType} · {doc.pageCount ?? "?"} page
									{doc.pageCount !== 1 ? "s" : ""}
								</p>
							</div>
						</TabsContent>
					))}
				</Tabs>
			) : (
				<div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
					No documents uploaded
				</div>
			)}

			<div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
				<div className="flex items-center gap-3">
					{extractionDate && (
						<span>
							Extracted{" "}
							{extractionDate.toLocaleDateString("en-US", {
								month: "short",
								day: "numeric",
							})}
						</span>
					)}
					<span>{documents.length} doc(s)</span>
					{aggregateConfidence > 0 && (
						<Badge variant="secondary" className="text-xs">
							{Math.round(aggregateConfidence)}% avg confidence
						</Badge>
					)}
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={onReExtract}
					disabled={isExtracting}
				>
					<RefreshCw
						className={`mr-1 h-3 w-3 ${isExtracting ? "animate-spin" : ""}`}
					/>
					{isExtracting ? "Extracting..." : "Re-extract"}
				</Button>
			</div>
		</div>
	);
}
