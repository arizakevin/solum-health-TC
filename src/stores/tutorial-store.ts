"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const STEP_COUNT = 5;

export interface TutorialState {
	hasSeenTutorial: boolean;
	isTutorialActive: boolean;
	currentStep: number;
	startTutorial: () => void;
	nextStep: () => void;
	setTutorialStep: (step: number) => void;
	skipTutorial: () => void;
	resetTutorial: () => void;
}

export const useTutorialStore = create<TutorialState>()(
	persist(
		(set) => ({
			hasSeenTutorial: false,
			isTutorialActive: false,
			currentStep: 0,
			startTutorial: () =>
				set({ isTutorialActive: true, currentStep: 0, hasSeenTutorial: true }),
			nextStep: () =>
				set((s) => ({
					currentStep: Math.min(s.currentStep + 1, STEP_COUNT - 1),
				})),
			setTutorialStep: (step) =>
				set({
					currentStep: Math.max(0, Math.min(step, STEP_COUNT - 1)),
				}),
			skipTutorial: () =>
				set({ isTutorialActive: false, hasSeenTutorial: true, currentStep: 0 }),
			resetTutorial: () =>
				set({
					hasSeenTutorial: false,
					isTutorialActive: false,
					currentStep: 0,
				}),
		}),
		{
			name: "authscribe-tutorial",
			partialize: (state) => ({ hasSeenTutorial: state.hasSeenTutorial }),
		},
	),
);
