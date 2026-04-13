"use client";

import dynamic from "next/dynamic";

const AnalyticsLazy = dynamic(
	() => import("@vercel/analytics/next").then((m) => m.Analytics),
	{ ssr: false },
);

export function WebAnalytics() {
	return <AnalyticsLazy />;
}
