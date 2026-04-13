"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getCasesPage } from "@/app/actions/cases";
import {
	type TooltipPosition,
	TutorialOverlay,
} from "@/components/tutorial/tutorial-overlay";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/brand";
import { useTutorialStore } from "@/stores/tutorial-store";

interface TourStep {
	targetId: string;
	title: string;
	content: string;
	position: TooltipPosition;
	routePrefix: string;
}

const STEPS: TourStep[] = [
	{
		targetId: "case-list-table",
		title: "Case dashboard",
		content:
			"This is your case dashboard. Each row is a patient case with uploaded documents and extraction status.",
		position: "bottom",
		routePrefix: "/",
	},
	{
		targetId: "btn-new-case",
		title: "New case",
		content:
			"Start a new case to upload clinical documents. Supported formats: PDF, PNG, JPG, TIFF.",
		position: "bottom",
		routePrefix: "/",
	},
	{
		targetId: "case-review-grid",
		title: "Case review",
		content:
			"After extraction, review AI-filled fields side-by-side with source documents. Edit any field to correct it.",
		position: "center",
		routePrefix: "/case/",
	},
	{
		targetId: "btn-approve-pdf",
		title: "Approve and PDF",
		content:
			"When you are satisfied, approve and generate a completed service request form as a PDF.",
		position: "top",
		routePrefix: "/case/",
	},
	{
		targetId: "metrics-cards",
		title: "Metrics",
		content:
			"Track extraction confidence, form completeness, and correction rates across all cases.",
		position: "bottom",
		routePrefix: "/metrics",
	},
];

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
		skipTutorial,
	} = useTutorialStore();

	const [firstCaseId, setFirstCaseId] = useState<string | null>(null);
	const [caseFetchDone, setCaseFetchDone] = useState(false);

	const showWelcome = pathname === "/" && !hasSeenTutorial && !isTutorialActive;

	const step = isTutorialActive ? STEPS[currentStep] : null;
	const isLast = currentStep >= STEPS.length - 1;

	useEffect(() => {
		if (!isTutorialActive) {
			setFirstCaseId(null);
			setCaseFetchDone(false);
			return;
		}
		setCaseFetchDone(false);
		getCasesPage({}, 1, 1)
			.then((r) => {
				setFirstCaseId(r.cases[0]?.id ?? null);
			})
			.finally(() => {
				setCaseFetchDone(true);
			});
	}, [isTutorialActive]);

	/** When the user navigates manually, align the tour step to the obvious screen. */
	useEffect(() => {
		if (!isTutorialActive) return;

		if (pathname.startsWith("/metrics")) {
			if (currentStep !== STEPS.length - 1) {
				setTutorialStep(STEPS.length - 1);
			}
			return;
		}

		if (/^\/case\/[^/]+/.test(pathname)) {
			if (currentStep <= 1) {
				setTutorialStep(2);
			}
			return;
		}

		if (pathname === "/") {
			if (currentStep >= 2 && currentStep <= STEPS.length - 1) {
				setTutorialStep(0);
			}
		}
	}, [isTutorialActive, pathname, currentStep, setTutorialStep]);

	const pushRouteForStep = useCallback(
		(stepIndex: number) => {
			if (stepIndex <= 1) {
				if (pathname !== "/") router.push("/");
				return;
			}
			if (stepIndex === 2 || stepIndex === 3) {
				if (!firstCaseId) return;
				const expected = `/case/${firstCaseId}`;
				if (!pathname.startsWith(expected)) router.push(expected);
				return;
			}
			if (stepIndex === STEPS.length - 1 && !pathname.startsWith("/metrics")) {
				router.push("/metrics");
			}
		},
		[pathname, router, firstCaseId],
	);

	const showNeedsCase =
		isTutorialActive &&
		caseFetchDone &&
		(currentStep === 2 || currentStep === 3) &&
		!firstCaseId;

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
		const nextIdx = currentStep + 1;
		nextStep();
		pushRouteForStep(nextIdx);
	}, [currentStep, isLast, nextStep, pushRouteForStep, skipTutorial]);

	const handleSkipTour = useCallback(() => {
		skipTutorial();
	}, [skipTutorial]);

	const handleNeedsCaseDismiss = useCallback(() => {
		skipTutorial();
	}, [skipTutorial]);

	return (
		<>
			<Dialog open={showWelcome} onOpenChange={handleWelcomeOpenChange}>
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

			<Dialog
				open={showNeedsCase}
				onOpenChange={(o) => !o && handleNeedsCaseDismiss()}
			>
				<DialogContent className="sm:max-w-md" showCloseButton>
					<DialogHeader>
						<DialogTitle>Create a case first</DialogTitle>
						<DialogDescription>
							The next tour steps show case review and PDF approval. Create a
							case from the dashboard, then use &quot;Restart guided tour&quot;
							in the menu when you are ready.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button type="button" onClick={handleNeedsCaseDismiss}>
							OK
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{step && isTutorialActive && !showNeedsCase && (
				<TutorialOverlay
					open
					stepIndex={currentStep}
					stepCount={STEPS.length}
					title={step.title}
					content={step.content}
					position={step.position}
					targetId={step.targetId}
					onNext={handleNext}
					onSkip={handleSkipTour}
					isLast={isLast}
				/>
			)}
		</>
	);
}
