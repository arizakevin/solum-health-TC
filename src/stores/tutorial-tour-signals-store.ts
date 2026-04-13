"use client";

import { create } from "zustand";

/** Live case page signals for reactive tutorial steps (not persisted). */
export type TutorialTourCaseSignals = {
	caseId: string;
	documentCount: number;
	hasExtraction: boolean;
	caseStatus: string;
	isExtracting: boolean;
	/** Extraction settings popover is open (gear menu). */
	extractionSettingsOpen: boolean;
	/** Inline document preview is open beside the form. */
	sideBySidePreviewOpen: boolean;
};

type TutorialTourSignalsState = {
	case: TutorialTourCaseSignals | null;
	setTourCaseSignals: (payload: TutorialTourCaseSignals | null) => void;
};

export const useTutorialTourSignalsStore = create<TutorialTourSignalsState>(
	(set) => ({
		case: null,
		setTourCaseSignals: (payload) => set({ case: payload }),
	}),
);
