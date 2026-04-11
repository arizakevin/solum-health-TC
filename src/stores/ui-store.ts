"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
	annieDrawerOpen: boolean;
	setAnnieDrawerOpen: (open: boolean) => void;
	toggleAnnieDrawer: () => void;
}

export const useUIStore = create<UIState>()(
	persist(
		(set) => ({
			annieDrawerOpen: false,
			setAnnieDrawerOpen: (open) => set({ annieDrawerOpen: open }),
			toggleAnnieDrawer: () =>
				set((s) => ({ annieDrawerOpen: !s.annieDrawerOpen })),
		}),
		{
			name: "solum-ui",
			partialize: (state) => ({
				annieDrawerOpen: state.annieDrawerOpen,
			}),
		},
	),
);
