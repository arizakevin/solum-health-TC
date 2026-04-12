"use client";

import {
	BarChart3,
	FileCheck,
	FileText,
	ListChecks,
	TrendingUp,
} from "lucide-react";
import type { MetricsData } from "@/app/actions/metrics";
import { RecentCorrectionsTable } from "@/components/recent-corrections-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SECTION_NAMES: Record<string, string> = {
	header: "Header",
	sectionA: "A — Member",
	sectionB: "B — Provider",
	sectionC: "C — Referring",
	sectionD: "D — Service",
	sectionE: "E — Clinical",
	sectionF: "F — Justification",
	sectionG: "G — Attestation",
};

export function MetricsDashboard({ data }: { data: MetricsData }) {
	const correctionPct =
		data.fieldsCorrected.total > 0
			? (
					(data.fieldsCorrected.count / data.fieldsCorrected.total) *
					100
				).toFixed(1)
			: "0";

	return (
		<div className="space-y-6">
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Total Cases</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{data.totalCases}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Extraction Confidence
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div
							className={
								data.avgExtractionConfidence >= 80
									? "text-2xl font-bold text-emerald-400"
									: data.avgExtractionConfidence >= 50
										? "text-2xl font-bold text-amber-400"
										: "text-2xl font-bold text-red-400"
							}
						>
							{data.avgExtractionConfidence.toFixed(0)}%
						</div>
						{data.extractionConfidenceIsLegacyEstimate ? (
							<p className="mt-1 text-xs text-muted-foreground">
								Estimated — re-extract cases for precise scores.
							</p>
						) : (
							<p className="mt-1 text-xs text-muted-foreground">
								Average AI certainty across all extracted cases.
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Form Completeness
						</CardTitle>
						<ListChecks className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{data.avgFormCompleteness.toFixed(0)}%
						</div>
						<p className="mt-1 text-xs text-muted-foreground">
							Average share of form fields filled across all cases.
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Fields Corrected
						</CardTitle>
						<FileCheck className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{data.fieldsCorrected.count}
							<span className="text-base font-normal text-muted-foreground">
								{" "}
								/ {data.fieldsCorrected.total}
							</span>
						</div>
						<p className="text-xs text-muted-foreground">{correctionPct}%</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Docs Processed
						</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{data.docsProcessed}</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						Corrections by Form Section
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{Object.entries(data.correctionsBySection).map(
							([section, stats]) => {
								const pct =
									stats.total > 0 ? (stats.corrected / stats.total) * 100 : 0;
								return (
									<div key={section} className="space-y-1">
										<div className="flex items-center justify-between text-sm">
											<span>{SECTION_NAMES[section] ?? section}</span>
											<span className="text-muted-foreground">
												{stats.corrected}/{stats.total} ({pct.toFixed(0)}%)
											</span>
										</div>
										<div className="h-2 rounded-full bg-muted">
											<div
												className="h-2 rounded-full bg-primary transition-all"
												style={{ width: `${Math.min(pct, 100)}%` }}
											/>
										</div>
									</div>
								);
							},
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Recent Corrections</CardTitle>
				</CardHeader>
				<CardContent>
					<RecentCorrectionsTable />
				</CardContent>
			</Card>
		</div>
	);
}
