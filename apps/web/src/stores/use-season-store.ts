import { create } from "zustand";

export type Season = "autumn" | "winter" | "off";

interface SeasonState {
  currentSeason: Season;
  setSeason: (season: Season) => void;
  autoDetectSeason: () => void;
}

const getSeasonFromMonth = (month: number): Season => {
  // Autumn: Aug, Sep, Oct
  if (month >= 7 && month <= 9) return "autumn";
  // Winter: Nov, Dec, Jan
  if (month >= 10 || month === 0) return "winter";
  // Default to off for other months
  return "autumn";
};

export const useSeasonStore = create<SeasonState>((set) => ({
  currentSeason: getSeasonFromMonth(new Date().getMonth()),
  setSeason: (season) => set({ currentSeason: season }),
  autoDetectSeason: () => set({ currentSeason: getSeasonFromMonth(new Date().getMonth()) }),
}));
