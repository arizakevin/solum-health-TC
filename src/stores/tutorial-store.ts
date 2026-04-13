"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TUTORIAL_STEP_COUNT } from "@/lib/tutorial-steps";

export interface TutorialState {
	hasSeenTutorial: boolean;
	isTutorialActive: boolean;
	currentStep: number;
	/** Case opened during this tour (set when user reaches `/case/:id` from step 1). Persisted while the tour is active. */
	tourAnchorCaseId: string | null;
	startTutorial: () => void;
	nextStep: () => void;
	setTutorialStep: (step: number) => void;
	setTourAnchorCaseId: (id: string | null) => void;
	skipTutorial: () => void;
	resetTutorial: () => void;
}

export const useTutorialStore = create<TutorialState>()(
	persist(
		(set) => ({
			hasSeenTutorial: false,
			isTutorialActive: false,
			currentStep: 0,
			tourAnchorCaseId: null,
			startTutorial: () =>
				set({
					isTutorialActive: true,
					currentStep: 0,
					hasSeenTutorial: true,
					tourAnchorCaseId: null,
				}),
			nextStep: () =>
				set((s) => ({
					currentStep: Math.min(s.currentStep + 1, TUTORIAL_STEP_COUNT - 1),
				})),
			setTutorialStep: (step) =>
				set({
					currentStep: Math.max(0, Math.min(step, TUTORIAL_STEP_COUNT - 1)),
				}),
			setTourAnchorCaseId: (tourAnchorCaseId) => set({ tourAnchorCaseId }),
			skipTutorial: () =>
				set({
					isTutorialActive: false,
					hasSeenTutorial: true,
					currentStep: 0,
					tourAnchorCaseId: null,
				}),
			resetTutorial: () =>
				set({
					hasSeenTutorial: false,
					isTutorialActive: false,
					currentStep: 0,
					tourAnchorCaseId: null,
				}),
		}),
		{
			name: "authscribe-tutorial",
			partialize: (state) => ({
				hasSeenTutorial: state.hasSeenTutorial,
				isTutorialActive: state.isTutorialActive,
				currentStep: state.currentStep,
				tourAnchorCaseId: state.tourAnchorCaseId,
			}),
		},
	),
);
