"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/lib/brand";

export default function SignInPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<div className="mx-auto mb-2 flex items-center gap-2">
						<Plus className="h-6 w-6 rounded-full bg-primary p-0.5 text-primary-foreground" />
						<span className="text-lg font-semibold">{APP_NAME}</span>
					</div>
					<CardTitle>Sign in to your account</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input id="email" type="email" placeholder="you@example.com" />
					</div>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="password">Password</Label>
							<button
								type="button"
								className="text-xs text-muted-foreground hover:underline"
							>
								Forgot password?
							</button>
						</div>
						<Input id="password" type="password" />
					</div>
					<Button className="w-full">Sign In</Button>

					<div className="relative">
						<Separator />
						<span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
							or
						</span>
					</div>

					<Button variant="outline" className="w-full">
						Sign in with Google
					</Button>

					<p className="text-center text-xs text-muted-foreground">
						Don&apos;t have an account?{" "}
						<button
							type="button"
							className="text-foreground underline hover:no-underline"
						>
							Sign up
						</button>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
