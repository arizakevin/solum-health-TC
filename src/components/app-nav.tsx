"use client";

import { GraduationCap, LogOut, Menu, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AppBrandLink } from "@/components/app-brand-link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useTutorialStore } from "@/stores/tutorial-store";

const NAV_LINKS = [
	{ href: "/", label: "Dashboard" },
	{ href: "/metrics", label: "Metrics" },
	{ href: "/docs", label: "Docs" },
] as const;

export function AppNav() {
	const pathname = usePathname();
	const router = useRouter();
	const { resolvedTheme, setTheme } = useTheme();
	const [userEmail, setUserEmail] = useState<string | null>(null);
	const [initials, setInitials] = useState("U");
	const [themeMounted, setThemeMounted] = useState(false);

	useEffect(() => {
		setThemeMounted(true);
	}, []);

	useEffect(() => {
		const supabase = createClient();
		supabase.auth.getUser().then(({ data: { user } }) => {
			if (user) {
				setUserEmail(user.email ?? null);
				const name =
					(user.user_metadata?.full_name as string) ?? user.email ?? "";
				const parts = name.split(/\s+/);
				setInitials(
					parts.length >= 2
						? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
						: name.slice(0, 2).toUpperCase(),
				);
			}
		});
	}, []);

	async function handleSignOut() {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/sign-in");
	}

	function handleRestartGuidedTour() {
		useTutorialStore.getState().resetTutorial();
		router.push("/");
	}

	return (
		<header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
				<AppBrandLink priority />

				<nav className="hidden items-center gap-1 md:flex">
					{NAV_LINKS.map(({ href, label }) => {
						const isActive =
							href === "/"
								? pathname === "/"
								: href === "/docs"
									? pathname === "/docs" || pathname.startsWith("/docs/")
									: pathname === href || pathname.startsWith(`${href}/`);
						return (
							<Link
								key={href}
								href={href}
								id={href === "/metrics" ? "tour-nav-metrics" : undefined}
								className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
									isActive
										? "bg-accent text-accent-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{label}
							</Link>
						);
					})}
				</nav>

				<div className="ml-auto flex items-center gap-2">
					{userEmail && (
						<span className="hidden text-xs text-muted-foreground sm:inline">
							{userEmail}
						</span>
					)}
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="rounded-full"
						onClick={() =>
							setTheme(resolvedTheme === "dark" ? "light" : "dark")
						}
						aria-label={
							!themeMounted
								? "Toggle color theme"
								: resolvedTheme === "dark"
									? "Switch to light mode"
									: "Switch to dark mode"
						}
					>
						{themeMounted && resolvedTheme === "dark" ? (
							<Sun className="size-4" />
						) : (
							<Moon className="size-4" />
						)}
					</Button>

					{/* Mobile hamburger (below md) */}
					<DropdownMenu>
						<DropdownMenuTrigger
							className="rounded-full md:hidden"
							aria-label="Navigation menu"
						>
							<div className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent">
								<Menu className="h-4 w-4" />
							</div>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{NAV_LINKS.map(({ href, label }) => (
								<DropdownMenuItem
									key={href}
									data-tour-nav-metrics={href === "/metrics" ? "" : undefined}
									onClick={() => router.push(href)}
								>
									{label}
								</DropdownMenuItem>
							))}
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleRestartGuidedTour}>
								<GraduationCap className="mr-2 h-4 w-4" />
								Restart guided tour
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleSignOut}>
								<LogOut className="mr-2 h-4 w-4" />
								Sign Out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Desktop avatar menu (md+) */}
					<DropdownMenu>
						<DropdownMenuTrigger className="hidden rounded-full md:inline-flex">
							<Avatar className="h-8 w-8">
								<AvatarFallback className="text-xs">{initials}</AvatarFallback>
							</Avatar>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={handleRestartGuidedTour}>
								<GraduationCap className="mr-2 h-4 w-4" />
								Restart guided tour
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleSignOut}>
								<LogOut className="mr-2 h-4 w-4" />
								Sign Out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
