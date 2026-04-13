"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { TutorialOverlay } from "@/components/tutorial/tutorial-overlay";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { APP_DESCRIPTION, APP_NAME, PRODUCT_NAME } from "@/lib/brand";
import {
	STEP_APPROVE,
	STEP_CASE_REVIEW,
	STEP_DASHBOARD,
	STEP_EXTRACTION_SETTINGS,
	STEP_FINALE,
	STEP_FORM,
	STEP_GENERATED_PDF,
	STEP_NEW_CASE,
	STEP_RUN_EXTRACT,
	STEP_TRY_UPLOAD,
	STEP_UPLOADS_INTRO,
	TUTORIAL_STEPS,
} from "@/lib/tutorial-steps";
import { useTutorialStore } from "@/stores/tutorial-store";
import { useTutorialTourSignalsStore } from "@/stores/tutorial-tour-signals-store";

function parseCaseIdFromPath(pathname: string): string | null {
	const m = pathname.match(/^\/case\/([^/]+)/);
	const raw = m?.[1] ?? null;
	return raw ? raw.toLowerCase() : null;
}

function normalizeAnchor(id: string | null): string | null {
	return id ? id.toLowerCase() : null;
}

function isCasePdfPath(pathname: string, caseId: string): boolean {
	const pathOnly = (pathname.split("?")[0] ?? pathname).toLowerCase();
	const id = caseId.toLowerCase();
	const prefix = `/case/${id}/pdf`;
	return (
		pathOnly === prefix ||
		pathOnly === `${prefix}/` ||
		pathOnly.startsWith(`${prefix}/`)
	);
}

/**
 * Whether the current URL is allowed for this step.
 * `STEP_GENERATED_PDF` must be on `/case/:id/pdf` so “Back to Case” does not
 * leave the tour on the wrong step; earlier case steps may be on review or PDF
 * during navigation transitions.
 */
function isTutorialStepOnAllowedPath(
	pathname: string,
	step: number,
	tourAnchorCaseId: string | null,
): boolean {
	if (step === STEP_FINALE) return true;

	const pathOnly = pathname.split("?")[0] ?? pathname;
	const caseIdFromPath = parseCaseIdFromPath(pathname);
	const onDashboard = pathOnly === "/";
	const onCasePage = Boolean(caseIdFromPath) && pathOnly.startsWith("/case/");
	const anchorNorm = normalizeAnchor(tourAnchorCaseId);

	if (step === STEP_DASHBOARD || step === STEP_NEW_CASE) {
		return onDashboard || onCasePage;
	}

	if (step === STEP_GENERATED_PDF) {
		if (!caseIdFromPath) return false;
		const anchorId = anchorNorm ?? caseIdFromPath;
		if (anchorNorm && caseIdFromPath !== anchorNorm) return false;
		return isCasePdfPath(pathOnly, anchorId);
	}

	if (step >= STEP_UPLOADS_INTRO && step <= STEP_APPROVE) {
		if (!onCasePage) return false;
		if (!anchorNorm) return true;
		return caseIdFromPath === anchorNorm;
	}

	return true;
}

export function TutorialManager() {
	const pathname = usePathname();
	const router = useRouter();
	const {
		hasSeenTutorial,
		isTutorialActive,
		currentStep,
		startTutorial,
		nextStep,
		setTutorialStep,
		setTourAnchorCaseId,
		skipTutorial,
		resetTutorial,
	} = useTutorialStore();

	const tourCase = useTutorialTourSignalsStore((s) => s.case);

	const showWelcome = pathname === "/" && !hasSeenTutorial && !isTutorialActive;

	const step = isTutorialActive ? TUTORIAL_STEPS[currentStep] : null;
	const isLast = currentStep >= TUTORIAL_STEPS.length - 1;

	const activeCaseIdFromPath = parseCaseIdFromPath(pathname);
	const tutorialExtractingWait =
		Boolean(step) &&
		isTutorialActive &&
		currentStep === STEP_RUN_EXTRACT &&
		tourCase !== null &&
		activeCaseIdFromPath === tourCase.caseId &&
		!tourCase.hasExtraction &&
		(tourCase.isExtracting || tourCase.caseStatus === "Extracting");

	useEffect(() => {
		if (!isTutorialActive) {
			useTutorialTourSignalsStore.getState().setTourCaseSignals(null);
		}
	}, [isTutorialActive]);

	/**
	 * Sync tutorial step with route + case signals, then enforce allowed paths.
	 * `useLayoutEffect` runs before paint so we never flash a disallowed URL/step
	 * combo (the separate `useEffect` guard could run before sync and call
	 * `skipTutorial()` while `currentStep` was still stale from the last render).
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: `currentStep` must re-run this effect when the tour step changes from the store; the body uses getState() for ordering-sensitive reads.
	useLayoutEffect(() => {
		if (!isTutorialActive) return;

		const pathOnly = pathname.split("?")[0] ?? pathname;
		const caseIdFromPath = parseCaseIdFromPath(pathname);
		const sig = tourCase;
		const sigCaseNorm = sig?.caseId ? sig.caseId.toLowerCase() : null;

		let { currentStep: step, tourAnchorCaseId: anchor } =
			useTutorialStore.getState();

		if (
			caseIdFromPath &&
			!normalizeAnchor(anchor) &&
			(step === STEP_APPROVE || step === STEP_GENERATED_PDF) &&
			isCasePdfPath(pathOnly, caseIdFromPath)
		) {
			setTourAnchorCaseId(caseIdFromPath);
			({ currentStep: step, tourAnchorCaseId: anchor } =
				useTutorialStore.getState());
		}

		let anchorKey = normalizeAnchor(anchor);

		if (
			step === STEP_GENERATED_PDF &&
			anchorKey &&
			caseIdFromPath === anchorKey &&
			!isCasePdfPath(pathOnly, anchorKey)
		) {
			setTutorialStep(STEP_APPROVE);
			return;
		}

		const onCaseReview =
			Boolean(caseIdFromPath) &&
			!pathOnly.includes("/pdf") &&
			pathOnly.startsWith("/case/");

		step = useTutorialStore.getState().currentStep;
		anchorKey = normalizeAnchor(useTutorialStore.getState().tourAnchorCaseId);
		if (step === STEP_NEW_CASE && onCaseReview && caseIdFromPath) {
			if (!anchorKey) {
				setTourAnchorCaseId(caseIdFromPath);
			}
			setTutorialStep(STEP_UPLOADS_INTRO);
			return;
		}

		if (
			anchorKey &&
			caseIdFromPath === anchorKey &&
			sig &&
			sigCaseNorm === anchorKey
		) {
			if (step === STEP_TRY_UPLOAD && sig.documentCount >= 1) {
				setTutorialStep(STEP_EXTRACTION_SETTINGS);
				return;
			}

			if (step === STEP_RUN_EXTRACT && sig.hasExtraction) {
				setTutorialStep(STEP_FORM);
				return;
			}

			if (step === STEP_CASE_REVIEW && sig.sideBySidePreviewOpen) {
				setTutorialStep(STEP_APPROVE);
				return;
			}
		}

		step = useTutorialStore.getState().currentStep;
		anchorKey = normalizeAnchor(useTutorialStore.getState().tourAnchorCaseId);
		if (
			step === STEP_APPROVE &&
			anchorKey &&
			caseIdFromPath === anchorKey &&
			isCasePdfPath(pathOnly, anchorKey)
		) {
			setTutorialStep(STEP_GENERATED_PDF);
			return;
		}

		const { tourAnchorCaseId: anchorAfter, currentStep: stepAfter } =
			useTutorialStore.getState();
		if (!isTutorialStepOnAllowedPath(pathname, stepAfter, anchorAfter)) {
			skipTutorial();
		}
	}, [
		isTutorialActive,
		pathname,
		currentStep,
		tourCase,
		setTutorialStep,
		setTourAnchorCaseId,
		skipTutorial,
	]);

	const handleWelcomeOpenChange = useCallback(
		(open: boolean) => {
			if (!open) skipTutorial();
		},
		[skipTutorial],
	);

	const handleNext = useCallback(() => {
		if (isLast) {
			skipTutorial();
			return;
		}
		if (TUTORIAL_STEPS[currentStep]?.advance === "manual") {
			nextStep();
		}
	}, [currentStep, isLast, nextStep, skipTutorial]);

	const handleSkipTour = useCallback(() => {
		skipTutorial();
	}, [skipTutorial]);

	const handleRestartTour = useCallback(() => {
		resetTutorial();
		router.push("/");
	}, [resetTutorial, router]);

	const hideNextButton =
		!isLast && TUTORIAL_STEPS[currentStep]?.advance === "wait";

	const finaleFooter = useMemo(
		() => (
			<div className="flex flex-wrap gap-2">
				<Button type="button" size="sm" onClick={handleNext}>
					Done
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={handleRestartTour}
				>
					Restart tour
				</Button>
			</div>
		),
		[handleNext, handleRestartTour],
	);

	const finaleDescription = useMemo(
		() => (
			<div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
				<p>
					That is the end of the guided tour. For extraction confidence, form
					completeness, and correction activity across cases, use the{" "}
					<Link
						href="/metrics"
						className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
					>
						Metrics
					</Link>{" "}
					page from the top navigation when you are ready.
				</p>
				<p>
					For architecture, data flow, and implementation notes, see the{" "}
					<Link
						href="/docs"
						className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
					>
						technical documentation for {PRODUCT_NAME}
					</Link>
					. You can restart the guided tour at any time from the account menu in
					the header—the circular control that shows your initials.
				</p>
			</div>
		),
		[],
	);

	const overlayContent: ReactNode = useMemo(() => {
		if (tutorialExtractingWait) {
			return "Please wait while your uploads are processed. When extraction finishes, values flow into the request form and the tour continues on its own — no action needed here.";
		}
		if (step?.centered) return finaleDescription;
		return step?.content ?? "";
	}, [
		tutorialExtractingWait,
		step?.centered,
		step?.content,
		finaleDescription,
	]);

	return (
		<>
			{showWelcome ? (
				<Dialog defaultOpen onOpenChange={handleWelcomeOpenChange}>
					<DialogContent className="sm:max-w-md" showCloseButton>
						<DialogHeader>
							<DialogTitle>Welcome to {APP_NAME}</DialogTitle>
							<DialogDescription>{APP_DESCRIPTION}</DialogDescription>
						</DialogHeader>
						<DialogFooter className="gap-2 sm:justify-end">
							<Button
								variant="outline"
								type="button"
								onClick={() => skipTutorial()}
							>
								Skip
							</Button>
							<Button
								type="button"
								onClick={() => {
									startTutorial();
									if (pathname !== "/") router.push("/");
								}}
							>
								Take a quick tour
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			) : null}

			{step && isTutorialActive && (
				<TutorialOverlay
					open
					routeKey={pathname}
					stepIndex={currentStep}
					stepCount={TUTORIAL_STEPS.length}
					title={tutorialExtractingWait ? "Extracting documents" : step.title}
					content={overlayContent}
					position={step.position}
					targetId={step.targetId}
					onNext={handleNext}
					onSkip={handleSkipTour}
					isLast={isLast}
					hideNextButton={hideNextButton}
					dock={tutorialExtractingWait ? "bottom-right" : undefined}
					centered={Boolean(step.centered || step.introCentered)}
					footer={currentStep === STEP_FINALE ? finaleFooter : undefined}
					showSkip={currentStep !== STEP_FINALE}
				/>
			)}
		</>
	);
}
