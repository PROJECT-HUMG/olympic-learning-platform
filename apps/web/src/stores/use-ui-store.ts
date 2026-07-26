import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  showAiWidget: boolean;
  setShowAiWidget: (show: boolean) => void;
  toggleAiWidget: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      showAiWidget: true,
      setShowAiWidget: (show) => set({ showAiWidget: show }),
      toggleAiWidget: () => set((state) => ({ showAiWidget: !state.showAiWidget })),
    }),
    {
      name: "olympic-ui-storage",
    }
  )
);
