"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AppBrandLink } from "@/components/app-brand-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

export function SignInContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [mode, setMode] = useState<Mode>("sign-in");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [fullName, setFullName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const redirectTo = searchParams.get("redirect") ?? "/";

	async function handleEmailAuth(e: React.FormEvent) {
		e.preventDefault();
		setIsLoading(true);
		setError(null);
		setSuccess(null);

		try {
			const supabase = createClient();

			if (mode === "sign-up") {
				const { data, error: signUpError } = await supabase.auth.signUp({
					email,
					password,
					options: {
						data: { full_name: fullName },
					},
				});
				if (signUpError) {
					setError(signUpError.message);
					return;
				}
				if (data.user && !data.session) {
					setSuccess(
						"Account created! Check your email to confirm, then sign in.",
					);
					setMode("sign-in");
					return;
				}
			} else {
				const { error: signInError } = await supabase.auth.signInWithPassword({
					email,
					password,
				});
				if (signInError) {
					setError(signInError.message);
					return;
				}
			}

			router.push(redirectTo);
			router.refresh();
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<div className="mx-auto mb-2 flex w-fit max-w-full justify-center px-2">
						<AppBrandLink className="mt-0 sm:mt-0" priority />
					</div>
					<CardTitle>
						{mode === "sign-in"
							? "Sign in to your account"
							: "Create an account"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleEmailAuth} className="space-y-4">
						{mode === "sign-up" && (
							<div className="space-y-2">
								<Label htmlFor="fullName">Full Name</Label>
								<Input
									id="fullName"
									type="text"
									value={fullName}
									onChange={(e) => setFullName(e.target.value)}
									placeholder="Jane Doe"
									required
								/>
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								required
								minLength={6}
							/>
						</div>

						{error && <p className="text-sm text-red-500">{error}</p>}
						{success && <p className="text-sm text-green-600">{success}</p>}

						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading
								? "Loading..."
								: mode === "sign-in"
									? "Sign In"
									: "Create Account"}
						</Button>
					</form>

					<p className="mt-4 text-center text-xs text-muted-foreground">
						{mode === "sign-in" ? (
							<>
								Don&apos;t have an account?{" "}
								<button
									type="button"
									onClick={() => {
										setMode("sign-up");
										setError(null);
									}}
									className="text-foreground underline hover:no-underline"
								>
									Sign up
								</button>
							</>
						) : (
							<>
								Already have an account?{" "}
								<button
									type="button"
									onClick={() => {
										setMode("sign-in");
										setError(null);
									}}
									className="text-foreground underline hover:no-underline"
								>
									Sign in
								</button>
							</>
						)}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
