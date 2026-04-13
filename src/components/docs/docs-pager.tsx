import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { docsNavNeighbors, navHref } from "@/lib/docs/sidebar";
import { cn } from "@/lib/utils";

type DocsPagerProps = {
	relFromDocs: string;
};

const linkClass =
	"flex flex-col gap-0.5 rounded-md border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-muted/50 sm:max-w-[min(100%,20rem)]";

export function DocsPager({ relFromDocs }: DocsPagerProps) {
	const { prev, next } = docsNavNeighbors(relFromDocs);
	if (!prev && !next) {
		return null;
	}

	return (
		<nav
			className="mt-12 border-t border-border pt-6"
			aria-label="Adjacent documentation pages"
		>
			<div className="grid gap-3 sm:grid-cols-2 sm:gap-6">
				<div className="min-w-0">
					{prev ? (
						<Link
							href={navHref(prev.relFromDocs)}
							rel="prev"
							className={cn(linkClass, "text-left")}
						>
							<span className="text-xs text-muted-foreground">Previous</span>
							<span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
								<ChevronLeft
									className="size-4 shrink-0 opacity-70"
									aria-hidden
								/>
								<span className="truncate">{prev.label}</span>
							</span>
						</Link>
					) : null}
				</div>
				<div className="min-w-0 sm:text-right">
					{next ? (
						<Link
							href={navHref(next.relFromDocs)}
							rel="next"
							className={cn(
								linkClass,
								"text-left sm:ml-auto sm:inline-flex sm:items-end sm:text-right",
							)}
						>
							<span className="text-xs text-muted-foreground">Next</span>
							<span className="inline-flex items-center gap-1 text-sm font-medium text-foreground sm:justify-end">
								<span className="truncate">{next.label}</span>
								<ChevronRight
									className="size-4 shrink-0 opacity-70"
									aria-hidden
								/>
							</span>
						</Link>
					) : null}
				</div>
			</div>
		</nav>
	);
}
