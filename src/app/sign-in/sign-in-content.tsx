"use client";

import { Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/lib/brand";
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

	const redirectTo = searchParams.get("redirect") ?? "/";

	async function handleEmailAuth(e: React.FormEvent) {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		const supabase = createClient();

		if (mode === "sign-up") {
			const { error: signUpError } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: { full_name: fullName },
				},
			});
			if (signUpError) {
				setError(signUpError.message);
				setIsLoading(false);
				return;
			}
		} else {
			const { error: signInError } = await supabase.auth.signInWithPassword({
				email,
				password,
			});
			if (signInError) {
				setError(signInError.message);
				setIsLoading(false);
				return;
			}
		}

		router.push(redirectTo);
		router.refresh();
	}

	async function handleGoogleSignIn() {
		setIsLoading(true);
		setError(null);
		const supabase = createClient();

		const { error: googleError } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`,
			},
		});

		if (googleError) {
			setError(googleError.message);
			setIsLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<div className="mx-auto mb-2 flex items-center gap-2">
						<Plus className="h-6 w-6 rounded-full bg-primary p-0.5 text-primary-foreground" />
						<span className="text-lg font-semibold">{APP_NAME}</span>
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

						<Button className="w-full" disabled={isLoading}>
							{isLoading
								? "Loading..."
								: mode === "sign-in"
									? "Sign In"
									: "Create Account"}
						</Button>
					</form>

					<div className="relative my-4">
						<Separator />
						<span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
							or
						</span>
					</div>

					<Button
						variant="outline"
						className="w-full"
						onClick={handleGoogleSignIn}
						disabled={isLoading}
					>
						Sign in with Google
					</Button>

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
