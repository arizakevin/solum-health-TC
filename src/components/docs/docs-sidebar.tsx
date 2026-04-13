"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCS_SIDEBAR, navHref } from "@/lib/docs/sidebar";
import { cn } from "@/lib/utils";

function sectionHeadingId(title: string): string {
	const slug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return `docs-nav-${slug}`;
}

export function DocsSidebar() {
	const pathname = usePathname();

	return (
		<aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-56 lg:self-start xl:w-64">
			<nav className="rounded-lg border bg-card/40 p-3 text-sm">
				<p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Repository docs
				</p>
				<div className="flex flex-col gap-5">
					{DOCS_SIDEBAR.map((group) => (
						<section
							key={group.title}
							aria-labelledby={sectionHeadingId(group.title)}
							className="space-y-1.5"
						>
							<p
								id={sectionHeadingId(group.title)}
								className="px-2 text-xs font-semibold leading-snug text-foreground/90"
							>
								{group.title}
							</p>
							<ul className="ml-2 space-y-0.5 border-l-2 border-border pl-3">
								{group.items.map((item) => {
									const href = navHref(item.relFromDocs);
									const isActive =
										href === "/docs"
											? pathname === "/docs"
											: pathname === href || pathname.startsWith(`${href}/`);
									return (
										<li key={item.relFromDocs}>
											<Link
												href={href}
												className={cn(
													"block rounded-md px-2 py-1.5 text-[13px] leading-snug transition-colors",
													isActive
														? "bg-accent font-medium text-accent-foreground"
														: "text-foreground/80 hover:bg-muted/80 hover:text-foreground",
												)}
											>
												{item.label}
											</Link>
										</li>
									);
								})}
							</ul>
						</section>
					))}
				</div>
			</nav>
		</aside>
	);
}
