"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ExtractionPreferencesState {
	autoExtractOnUpload: boolean;
	setAutoExtractOnUpload: (value: boolean) => void;
	accordionExclusiveMode: boolean;
	setAccordionExclusiveMode: (value: boolean) => void;
}

type PersistedPreferences = Pick<
	ExtractionPreferencesState,
	"autoExtractOnUpload" | "accordionExclusiveMode"
>;

export const useExtractionPreferencesStore =
	create<ExtractionPreferencesState>()(
		persist(
			(set) => ({
				autoExtractOnUpload: false,
				setAutoExtractOnUpload: (autoExtractOnUpload) =>
					set({ autoExtractOnUpload }),
				accordionExclusiveMode: true,
				setAccordionExclusiveMode: (accordionExclusiveMode) =>
					set({ accordionExclusiveMode }),
			}),
			{
				name: "extraction-preferences",
				version: 2,
				migrate: (persistedState, fromVersion): PersistedPreferences => {
					const p = (persistedState ?? {}) as Partial<PersistedPreferences>;
					return {
						autoExtractOnUpload: p.autoExtractOnUpload ?? false,
						accordionExclusiveMode:
							fromVersion === 0 ? true : (p.accordionExclusiveMode ?? true),
					};
				},
				partialize: (state) => ({
					autoExtractOnUpload: state.autoExtractOnUpload,
					accordionExclusiveMode: state.accordionExclusiveMode,
				}),
			},
		),
	);
