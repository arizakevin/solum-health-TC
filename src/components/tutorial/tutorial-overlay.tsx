"use client";

import type { ReactNode } from "react";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui/button";
import type { TooltipPosition } from "@/lib/tutorial-steps";
import { cn } from "@/lib/utils";

export type { TooltipPosition };

export type TutorialDock = "bottom-right";

const CARD_W = 320;
const GAP = 12;
const VIEWPORT_PAD = 8;
/** Initial vertical guess; corrected after layout if the card overlaps the target. */
const EST_CARD_H = 280;
const ARROW_MAX_OFFSET = 130;

const TOUR_NAV_METRICS_ID = "tour-nav-metrics";
const TOUR_EXTRACTION_SETTINGS_TRIGGER = "tour-tutorial-extraction-settings";
const TOUR_FIRST_SOURCE_DOC = "tour-case-review-first-source-doc";
const TOUR_SOURCE_DOCUMENTS_BODY = "tour-source-documents-body";
const TOUR_FORM_SECTIONS = "tour-tutorial-form-sections";
const TOUR_GENERATED_PDF_VIEW = "tour-tutorial-generated-pdf-view";

function resolveTourTargetElement(targetId: string): Element | null {
	if (!targetId) return null;
	if (targetId === TOUR_FIRST_SOURCE_DOC) {
		const first = document.getElementById(TOUR_FIRST_SOURCE_DOC);
		if (first) {
			const r = first.getBoundingClientRect();
			if (r.width > 0 && r.height > 0) return first;
		}
		return (
			document.getElementById(TOUR_SOURCE_DOCUMENTS_BODY) ??
			document.getElementById("case-source-documents") ??
			document.getElementById("tour-tutorial-case-review-workspace")
		);
	}
	if (targetId === TOUR_EXTRACTION_SETTINGS_TRIGGER) {
		/** Always anchor to the trigger — switching to the popup while it opens or animates caused rect thrash and a jumping tooltip (step 5). */
		return document.getElementById(TOUR_EXTRACTION_SETTINGS_TRIGGER);
	}
	if (targetId === TOUR_NAV_METRICS_ID) {
		const desktop = document.getElementById(TOUR_NAV_METRICS_ID);
		if (desktop) {
			const r = desktop.getBoundingClientRect();
			if (r.width > 0 && r.height > 0) return desktop;
		}
		const mobile = document.querySelector("[data-tour-nav-metrics]");
		if (mobile) return mobile;
		return desktop;
	}
	if (targetId === TOUR_FORM_SECTIONS) {
		const formPanel = document.getElementById(TOUR_FORM_SECTIONS);
		if (formPanel) {
			const r = formPanel.getBoundingClientRect();
			if (r.width > 0 && r.height > 0) return formPanel;
		}
		return (
			document.getElementById("case-review-grid") ??
			document.getElementById("tour-tutorial-case-review-workspace")
		);
	}
	if (targetId === TOUR_GENERATED_PDF_VIEW) {
		const root = document.getElementById(TOUR_GENERATED_PDF_VIEW);
		if (!root) return null;
		const r = root.getBoundingClientRect();
		if (r.width > 0 && r.height > 0) return root;
		return null;
	}
	return document.getElementById(targetId);
}

type ArrowState =
	| { show: false }
	| {
			show: true;
			edge: "top" | "bottom" | "left" | "right";
			offsetPx: number;
	  };

interface TutorialOverlayProps {
	open: boolean;
	/** Next.js pathname — remeasure when the route changes without a step change. */
	routeKey?: string;
	stepIndex: number;
	stepCount: number;
	title: string;
	content: ReactNode;
	position: TooltipPosition;
	targetId: string;
	onNext: () => void;
	onSkip: () => void;
	isLast: boolean;
	/** When true (non-final steps), the primary button is hidden — the tour advances from user actions. */
	hideNextButton?: boolean;
	/** Fixed corner card — avoids covering the main workspace (e.g. during extraction). */
	dock?: TutorialDock;
	/** Centered card with no anchor (finale). */
	centered?: boolean;
	/** Replaces default Next/Done + Skip row when set. */
	footer?: ReactNode;
	/** When false, hides Skip tour (e.g. finale). @default true */
	showSkip?: boolean;
}

export function TutorialOverlay({
	open,
	routeKey,
	stepIndex,
	stepCount,
	title,
	content,
	position,
	targetId,
	onNext,
	onSkip,
	isLast,
	hideNextButton = false,
	dock,
	centered = false,
	footer,
	showSkip = true,
}: TutorialOverlayProps) {
	const cardRef = useRef<HTMLDivElement>(null);
	/** Coalesce ResizeObserver / scroll / poll so we do not stack many layout passes in one frame (reduces jitter). */
	const positionRafRef = useRef<number | null>(null);
	const [cardStyle, setCardStyle] = useState<React.CSSProperties>({
		visibility: "hidden",
	});
	const [arrow, setArrow] = useState<ArrowState>({ show: false });

	/** Hide the card during step transitions to prevent visible position jumps between distant targets. */
	// biome-ignore lint/correctness/useExhaustiveDependencies: stepIndex is the intentional trigger — state setters are stable
	useLayoutEffect(() => {
		setCardStyle({ visibility: "hidden" });
		setArrow({ show: false });
	}, [stepIndex]);

	const clampArrowOffset = useCallback((targetCx: number, left: number) => {
		const cardCx = left + CARD_W / 2;
		return Math.max(
			-ARROW_MAX_OFFSET,
			Math.min(ARROW_MAX_OFFSET, targetCx - cardCx),
		);
	}, []);

	const clampArrowOffsetY = useCallback(
		(targetCy: number, cardTop: number, cardH: number) => {
			const cardCy = cardTop + cardH / 2;
			return Math.max(
				-ARROW_MAX_OFFSET,
				Math.min(ARROW_MAX_OFFSET, targetCy - cardCy),
			);
		},
		[],
	);

	const updatePosition = useCallback(() => {
		void routeKey;
		if (!open) return;
		if (centered) {
			setCardStyle({
				position: "fixed",
				left: "50%",
				top: "50%",
				transform: "translate(-50%, -50%)",
				width: CARD_W,
				maxWidth: "min(100vw - 24px, 360px)",
				visibility: "visible",
			});
			setArrow({ show: false });
			return;
		}
		if (dock === "bottom-right") {
			setCardStyle({
				position: "fixed",
				right: VIEWPORT_PAD,
				bottom: VIEWPORT_PAD,
				left: "auto",
				top: "auto",
				transform: "none",
				width: CARD_W,
				visibility: "visible",
			});
			setArrow({ show: false });
			return;
		}
		const el = resolveTourTargetElement(targetId);
		if (!el) {
			setCardStyle({
				position: "fixed",
				right: VIEWPORT_PAD,
				bottom: VIEWPORT_PAD,
				left: "auto",
				top: "auto",
				transform: "none",
				width: CARD_W,
				visibility: "visible",
			});
			setArrow({ show: false });
			return;
		}
		const r = el.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		if (targetId === TOUR_EXTRACTION_SETTINGS_TRIGGER) {
			const chGuess = cardRef.current?.getBoundingClientRect().height ?? 170;
			let sideLeft = r.right + GAP;
			let cardEastOfGear = true;
			if (sideLeft + CARD_W > vw - VIEWPORT_PAD) {
				sideLeft = Math.max(VIEWPORT_PAD, r.left - GAP - CARD_W);
				cardEastOfGear = false;
			}
			let sideTop = r.top + r.height / 2 - chGuess / 2;
			sideTop = Math.max(
				VIEWPORT_PAD,
				Math.min(sideTop, vh - chGuess - VIEWPORT_PAD),
			);
			const gearCy = r.top + r.height / 2;
			const offsetY = clampArrowOffsetY(gearCy, sideTop, chGuess);
			setCardStyle({
				position: "fixed",
				left: sideLeft,
				top: sideTop,
				width: CARD_W,
				visibility: "visible",
			});
			setArrow({
				show: true,
				edge: cardEastOfGear ? "left" : "right",
				offsetPx: offsetY,
			});
			return;
		}

		let top = 0;
		let left = r.left + r.width / 2 - CARD_W / 2;
		left = Math.max(VIEWPORT_PAD, Math.min(left, vw - CARD_W - VIEWPORT_PAD));

		if (position === "bottom") {
			top = r.bottom + GAP;
			const cardHGuess =
				cardRef.current?.getBoundingClientRect().height ?? EST_CARD_H;
			const hFlip = cardHGuess > 48 ? cardHGuess : EST_CARD_H;
			if (top + hFlip > vh - VIEWPORT_PAD) {
				top = Math.max(VIEWPORT_PAD, r.top - GAP - hFlip);
			}
		} else if (position === "top") {
			/** Do not use EST_CARD_H here — real card is shorter; too large a guess leaves a visible gap and the overlap pass never runs. */
			const chGuess = cardRef.current?.getBoundingClientRect().height ?? 0;
			const h0 = chGuess > 48 ? chGuess : 170;
			top = r.top - GAP - h0;
			if (top < VIEWPORT_PAD) {
				top = r.bottom + GAP;
			}
		} else {
			top = r.top + r.height / 2 - EST_CARD_H / 2;
			top = Math.max(
				VIEWPORT_PAD,
				Math.min(top, vh - EST_CARD_H - VIEWPORT_PAD),
			);
		}

		setCardStyle({
			position: "fixed",
			left,
			top,
			width: CARD_W,
			visibility: "visible",
		});

		if (position === "center") {
			setArrow({ show: false });
			return;
		}

		const targetCx = r.left + r.width / 2;
		const offsetPx = clampArrowOffset(targetCx, left);
		const placedBelow = top >= r.bottom - 8;
		setArrow({
			show: true,
			edge: placedBelow ? "top" : "bottom",
			offsetPx,
		});

		/** Snap `position: "top"` using measured card height; overlap pass runs after layout so rects match `setCardStyle`. */
		requestAnimationFrame(() => {
			const snapTopAnchoredCard = () => {
				if (position !== "top") return;
				const c = cardRef.current;
				const t = resolveTourTargetElement(targetId);
				if (!c || !t) return;
				const trSnap = t.getBoundingClientRect();
				const ch = c.getBoundingClientRect().height;
				if (ch < 48) return;
				let snapTop = trSnap.top - GAP - ch;
				let snapLeft = trSnap.left + trSnap.width / 2 - CARD_W / 2;
				snapLeft = Math.max(
					VIEWPORT_PAD,
					Math.min(snapLeft, vw - CARD_W - VIEWPORT_PAD),
				);
				if (snapTop < VIEWPORT_PAD) {
					snapTop = trSnap.bottom + GAP;
				}
				const placedBelow = snapTop >= trSnap.bottom - 8;
				setCardStyle({
					position: "fixed",
					left: snapLeft,
					top: snapTop,
					width: CARD_W,
					visibility: "visible",
				});
				setArrow({
					show: true,
					edge: placedBelow ? "top" : "bottom",
					offsetPx: clampArrowOffset(trSnap.left + trSnap.width / 2, snapLeft),
				});
			};

			const runOverlapNudge = () => {
				const c = cardRef.current;
				const t = resolveTourTargetElement(targetId);
				if (!c || !t) return;
				const trN = t.getBoundingClientRect();
				const cr = c.getBoundingClientRect();
				const pad = 8;
				const overlapsVert =
					cr.bottom > trN.top - pad && cr.top < trN.bottom + pad;
				if (!overlapsVert) return;

				const h = cr.height;
				const targetCxm = trN.left + trN.width / 2;
				let leftAdj = targetCxm - CARD_W / 2;
				leftAdj = Math.max(
					VIEWPORT_PAD,
					Math.min(leftAdj, vw - CARD_W - VIEWPORT_PAD),
				);

				const belowTop = trN.bottom + GAP;
				if (belowTop + h <= vh - VIEWPORT_PAD) {
					setCardStyle({
						position: "fixed",
						left: leftAdj,
						top: belowTop,
						width: CARD_W,
						visibility: "visible",
					});
					setArrow({
						show: true,
						edge: "top",
						offsetPx: clampArrowOffset(targetCxm, leftAdj),
					});
					return;
				}

				const aboveTop = trN.top - GAP - h;
				if (aboveTop >= VIEWPORT_PAD) {
					setCardStyle({
						position: "fixed",
						left: leftAdj,
						top: aboveTop,
						width: CARD_W,
						visibility: "visible",
					});
					setArrow({
						show: true,
						edge: "bottom",
						offsetPx: clampArrowOffset(targetCxm, leftAdj),
					});
				}
			};

			if (position === "top") {
				snapTopAnchoredCard();
				requestAnimationFrame(() => {
					snapTopAnchoredCard();
					runOverlapNudge();
					requestAnimationFrame(runOverlapNudge);
				});
				return;
			}

			const card = cardRef.current;
			const target = resolveTourTargetElement(targetId);
			if (!card || !target) return;

			runOverlapNudge();
			requestAnimationFrame(runOverlapNudge);
		});
	}, [
		open,
		targetId,
		position,
		dock,
		centered,
		clampArrowOffset,
		clampArrowOffsetY,
		routeKey,
	]);

	const scheduleUpdatePosition = useCallback(() => {
		if (positionRafRef.current != null) return;
		positionRafRef.current = window.requestAnimationFrame(() => {
			positionRafRef.current = null;
			updatePosition();
		});
	}, [updatePosition]);

	useLayoutEffect(() => {
		updatePosition();
	}, [updatePosition]);

	/** Bring the anchored target into view when the step changes (Pyneer-style follow). */
	// biome-ignore lint/correctness/useExhaustiveDependencies: routeKey forces re-scroll after client navigation (e.g. case → PDF)
	useEffect(() => {
		if (!open) return;
		if (centered || dock === "bottom-right") return;
		const el = resolveTourTargetElement(targetId);
		if (!el || !(el instanceof HTMLElement)) return;
		const id = window.requestAnimationFrame(() => {
			/** `smooth` + frequent `updatePosition` fights the scroll animation and causes vertical jitter (steps 1, 5, 7). */
			el.scrollIntoView({ behavior: "auto", block: "nearest" });
		});
		return () => window.cancelAnimationFrame(id);
	}, [open, targetId, dock, centered, routeKey]);

	useEffect(() => {
		if (!open) return;
		updatePosition();
		if (dock === "bottom-right") {
			return;
		}
		/** Targets inside Suspense or late-hydrated trees may be missing on first layout; re-measure like Pyneer’s tour. */
		const poll = window.setInterval(() => {
			scheduleUpdatePosition();
		}, 400);
		const ro = new ResizeObserver(() => {
			scheduleUpdatePosition();
		});
		const t = resolveTourTargetElement(targetId);
		if (t) ro.observe(t);
		if (
			targetId === TOUR_FIRST_SOURCE_DOC ||
			targetId === TOUR_SOURCE_DOCUMENTS_BODY
		) {
			const inner = document.getElementById(TOUR_SOURCE_DOCUMENTS_BODY);
			if (inner) ro.observe(inner);
			const sourcePanel = document.getElementById("case-source-documents");
			if (sourcePanel) ro.observe(sourcePanel);
		}
		if (targetId === "tour-tutorial-approve-action") {
			const approveWrap = document.getElementById(
				"tour-tutorial-approve-action",
			);
			if (approveWrap) ro.observe(approveWrap);
		}
		if (targetId === TOUR_FORM_SECTIONS) {
			const formPanel = document.getElementById(TOUR_FORM_SECTIONS);
			if (formPanel) ro.observe(formPanel);
			const grid = document.getElementById("case-review-grid");
			if (grid) ro.observe(grid);
		}
		if (targetId === TOUR_GENERATED_PDF_VIEW) {
			const pdfRoot = document.getElementById(TOUR_GENERATED_PDF_VIEW);
			if (pdfRoot) ro.observe(pdfRoot);
		}
		window.addEventListener("scroll", scheduleUpdatePosition, true);
		window.addEventListener("resize", scheduleUpdatePosition);
		return () => {
			clearInterval(poll);
			ro.disconnect();
			window.removeEventListener("scroll", scheduleUpdatePosition, true);
			window.removeEventListener("resize", scheduleUpdatePosition);
			if (positionRafRef.current != null) {
				window.cancelAnimationFrame(positionRafRef.current);
				positionRafRef.current = null;
			}
		};
	}, [open, targetId, dock, updatePosition, scheduleUpdatePosition]);

	if (!open) return null;

	return (
		<div
			ref={cardRef}
			className={cn(
				"pointer-events-auto relative z-100 overflow-visible rounded-xl border-2 border-primary/35 bg-card p-4 text-card-foreground shadow-2xl ring-1 ring-primary/25",
				"motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out",
				"motion-reduce:transition-none",
			)}
			style={cardStyle}
			role="dialog"
			aria-modal="false"
			aria-labelledby="tutorial-step-title"
		>
			{arrow.show ? (
				<>
					{/* Outer triangle — same color as card border so stroke continues around the inner fill */}
					<div
						className={cn(
							"pointer-events-none absolute z-[19] h-0 w-0 motion-reduce:transition-none",
							(arrow.edge === "top" || arrow.edge === "bottom") &&
								"-translate-x-1/2 border-x-[11px] border-x-transparent",
							(arrow.edge === "left" || arrow.edge === "right") &&
								"-translate-y-1/2 border-y-[11px] border-y-transparent",
							arrow.edge === "top" &&
								"-top-3 border-b-[12px] border-b-primary/35",
							arrow.edge === "bottom" &&
								"-bottom-3 border-t-[12px] border-t-primary/35",
							arrow.edge === "left" &&
								"-left-3 border-r-[12px] border-r-primary/35",
							arrow.edge === "right" &&
								"-right-3 border-l-[12px] border-l-primary/35",
						)}
						style={
							arrow.edge === "left" || arrow.edge === "right"
								? { top: `calc(50% + ${arrow.offsetPx}px)` }
								: { left: `calc(50% + ${arrow.offsetPx}px)` }
						}
						aria-hidden
					/>
					<div
						className={cn(
							"pointer-events-none absolute z-20 h-0 w-0 motion-reduce:transition-none",
							(arrow.edge === "top" || arrow.edge === "bottom") &&
								"-translate-x-1/2 border-x-[9px] border-x-transparent",
							(arrow.edge === "left" || arrow.edge === "right") &&
								"-translate-y-1/2 border-y-[9px] border-y-transparent",
							arrow.edge === "top" && "-top-2.5 border-b-[10px] border-b-card",
							arrow.edge === "bottom" &&
								"-bottom-2.5 border-t-[10px] border-t-card",
							arrow.edge === "left" &&
								"-left-2.5 border-r-[10px] border-r-card",
							arrow.edge === "right" &&
								"-right-2.5 border-l-[10px] border-l-card",
						)}
						style={
							arrow.edge === "left" || arrow.edge === "right"
								? { top: `calc(50% + ${arrow.offsetPx}px)` }
								: { left: `calc(50% + ${arrow.offsetPx}px)` }
						}
						aria-hidden
					/>
				</>
			) : null}
			<div className="relative z-10">
				<p className="text-xs font-medium text-muted-foreground">
					Step {stepIndex + 1} of {stepCount}
				</p>
				<h2
					id="tutorial-step-title"
					className="mt-1 font-heading text-base font-semibold"
				>
					{title}
				</h2>
				<div className="mt-2 text-sm leading-relaxed text-muted-foreground">
					{content}
				</div>
				{footer ? (
					<div className="mt-4">{footer}</div>
				) : (
					<div className="mt-4 flex flex-wrap items-center gap-2">
						{isLast ? (
							<Button type="button" size="sm" onClick={onNext}>
								Done
							</Button>
						) : (
							!hideNextButton && (
								<Button type="button" size="sm" onClick={onNext}>
									Next
								</Button>
							)
						)}
						{showSkip ? (
							<button
								type="button"
								onClick={onSkip}
								className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
							>
								Skip tour
							</button>
						) : null}
					</div>
				)}
			</div>
		</div>
	);
}
