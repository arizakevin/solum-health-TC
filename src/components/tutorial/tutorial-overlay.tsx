"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TooltipPosition = "top" | "bottom" | "center";

const CARD_W = 320;
const GAP = 12;
const VIEWPORT_PAD = 8;

interface TutorialOverlayProps {
	open: boolean;
	stepIndex: number;
	stepCount: number;
	title: string;
	content: string;
	position: TooltipPosition;
	targetId: string;
	onNext: () => void;
	onSkip: () => void;
	isLast: boolean;
}

export function TutorialOverlay({
	open,
	stepIndex,
	stepCount,
	title,
	content,
	position,
	targetId,
	onNext,
	onSkip,
	isLast,
}: TutorialOverlayProps) {
	const [cardStyle, setCardStyle] = useState<React.CSSProperties>({
		visibility: "hidden",
	});

	const updatePosition = useCallback(() => {
		if (!open) return;
		const el = document.getElementById(targetId);
		if (!el) {
			setCardStyle({
				position: "fixed",
				left: "50%",
				top: "50%",
				transform: "translate(-50%, -50%)",
				width: CARD_W,
				visibility: "visible",
			});
			return;
		}
		const r = el.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		let top = 0;
		let left = r.left + r.width / 2 - CARD_W / 2;
		left = Math.max(VIEWPORT_PAD, Math.min(left, vw - CARD_W - VIEWPORT_PAD));

		const estCardH = 200;
		if (position === "bottom") {
			top = r.bottom + GAP;
			if (top + estCardH > vh - VIEWPORT_PAD) {
				top = Math.max(VIEWPORT_PAD, r.top - GAP - estCardH);
			}
		} else if (position === "top") {
			top = r.top - GAP - estCardH;
			if (top < VIEWPORT_PAD) {
				top = r.bottom + GAP;
			}
		} else {
			top = r.top + r.height / 2 - estCardH / 2;
			top = Math.max(VIEWPORT_PAD, Math.min(top, vh - estCardH - VIEWPORT_PAD));
		}

		setCardStyle({
			position: "fixed",
			left,
			top,
			width: CARD_W,
			visibility: "visible",
		});
	}, [open, targetId, position]);

	useLayoutEffect(() => {
		updatePosition();
	}, [updatePosition]);

	useEffect(() => {
		if (!open) return;
		updatePosition();
		const ro = new ResizeObserver(() => updatePosition());
		const t = document.getElementById(targetId);
		if (t) ro.observe(t);
		window.addEventListener("scroll", updatePosition, true);
		window.addEventListener("resize", updatePosition);
		return () => {
			ro.disconnect();
			window.removeEventListener("scroll", updatePosition, true);
			window.removeEventListener("resize", updatePosition);
		};
	}, [open, targetId, updatePosition]);

	if (!open) return null;

	return (
		<div
			className={cn(
				"pointer-events-auto z-[100] rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg transition-[opacity,transform] duration-200",
			)}
			style={cardStyle}
			role="dialog"
			aria-modal="false"
			aria-labelledby="tutorial-step-title"
		>
			<p className="text-xs font-medium text-muted-foreground">
				Step {stepIndex + 1} of {stepCount}
			</p>
			<h2
				id="tutorial-step-title"
				className="mt-1 font-heading text-base font-semibold"
			>
				{title}
			</h2>
			<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
				{content}
			</p>
			<div className="mt-4 flex flex-wrap items-center gap-2">
				<Button type="button" size="sm" onClick={onNext}>
					{isLast ? "Done" : "Next"}
				</Button>
				<button
					type="button"
					onClick={onSkip}
					className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
				>
					Skip tour
				</button>
			</div>
		</div>
	);
}
