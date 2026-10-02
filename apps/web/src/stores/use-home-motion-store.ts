import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface HomeMotionState {
  enabled: boolean | null;
  setEnabled: (enabled: boolean) => void;
}

export const useHomeMotionStore = create<HomeMotionState>()(
  persist(
    (set) => ({ enabled: null, setEnabled: (enabled) => set({ enabled }) }),
    {
      name: "olympic-home-motion",
      storage: createJSONStorage(() => ({
        getItem: (key) => {
          try {
            return localStorage.getItem(key);
          } catch {
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            localStorage.setItem(key, value);
          } catch {
            // Keep the preference in memory when storage is unavailable.
          }
        },
        removeItem: (key) => {
          try {
            localStorage.removeItem(key);
          } catch {
            // Storage may be blocked by browser settings.
          }
        },
      })),
      partialize: ({ enabled }) => ({ enabled }),
      merge: (saved, current) => {
        const enabled = (saved as Partial<HomeMotionState> | null)?.enabled;
        return { ...current, enabled: typeof enabled === "boolean" ? enabled : null };
      },
    },
  ),
);
