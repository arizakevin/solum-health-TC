"use client";

import { useTheme } from "next-themes";
import { useEffect, useId, useRef, useState } from "react";

export type MermaidDiagramProps = {
	source: string;
};

export function MermaidDiagram({ source }: MermaidDiagramProps) {
	const containerRef = useRef<HTMLElement | null>(null);
	const reactId = useId();
	const { resolvedTheme } = useTheme();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) {
			return;
		}
		let cancelled = false;
		setError(null);

		void (async () => {
			try {
				const mermaid = (await import("mermaid")).default;
				const theme = resolvedTheme === "dark" ? "dark" : "default";
				mermaid.initialize({
					startOnLoad: false,
					theme,
					securityLevel: "strict",
					fontFamily: "inherit",
					flowchart: { useMaxWidth: true },
					sequence: { useMaxWidth: true },
					gantt: { useMaxWidth: true },
				});
				const renderId = `mermaid-${reactId.replaceAll(":", "")}`;
				el.replaceChildren();
				const { svg, bindFunctions } = await mermaid.render(
					renderId,
					source.trim(),
				);
				if (cancelled) {
					return;
				}
				el.innerHTML = svg;
				bindFunctions?.(el);
			} catch (e) {
				if (!cancelled) {
					setError(e instanceof Error ? e.message : String(e));
				}
			}
		})();

		return () => {
			cancelled = true;
			el.replaceChildren();
		};
	}, [reactId, resolvedTheme, source]);

	if (error) {
		return (
			<div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
				<p className="font-medium">Could not render diagram</p>
				<p className="mt-1 font-mono text-xs opacity-90">{error}</p>
			</div>
		);
	}

	return (
		<section
			ref={containerRef}
			className="mermaid-docs flex justify-center [&_svg]:h-auto [&_svg]:max-w-full"
			aria-label="Diagram"
		/>
	);
}

MermaidDiagram.displayName = "MermaidDiagram";
