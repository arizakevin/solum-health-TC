"use client";

import { LogOut, Plus, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_NAME } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
	{ href: "/", label: "Dashboard" },
	{ href: "/upload", label: "Upload" },
	{ href: "/metrics", label: "Metrics" },
] as const;

export function AppNav() {
	const pathname = usePathname();
	const router = useRouter();

	async function handleSignOut() {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/sign-in");
	}

	return (
		<header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
				<Link href="/" className="flex items-center gap-2 font-semibold">
					<Plus className="h-5 w-5 rounded-full bg-primary p-0.5 text-primary-foreground" />
					{APP_NAME}
				</Link>

				<nav className="flex items-center gap-1">
					{NAV_LINKS.map(({ href, label }) => {
						const isActive =
							href === "/" ? pathname === "/" : pathname.startsWith(href);
						return (
							<Link
								key={href}
								href={href}
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

				<div className="ml-auto">
					<DropdownMenu>
						<DropdownMenuTrigger className="rounded-full">
							<Avatar className="h-8 w-8">
								<AvatarFallback>
									<User className="h-4 w-4" />
								</AvatarFallback>
							</Avatar>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
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
