"use client";

import NextTopLoader from "nextjs-toploader";

/** Thin top bar during client navigations; pairs with `app/(app)/loading.tsx`. */
export function NavigationProgress() {
	return (
		<NextTopLoader
			color="var(--foreground)"
			initialPosition={0.08}
			crawlSpeed={200}
			height={3}
			crawl
			showSpinner={false}
			easing="ease"
			speed={200}
			shadow="0 0 8px color-mix(in oklab, var(--foreground) 35%, transparent)"
		/>
	);
}
