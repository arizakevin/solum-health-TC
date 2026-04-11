"use client";

import { Suspense } from "react";
import { SignInContent } from "./sign-in-content";

export default function SignInPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					<p className="text-muted-foreground">Loading...</p>
				</div>
			}
		>
			<SignInContent />
		</Suspense>
	);
}
