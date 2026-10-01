import { useThemeStore } from "@/stores/use-theme-store";
import { useMediaQuery } from "./use-media-query";

export function useResolvedTheme() {
  const theme = useThemeStore((state) => state.theme);
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");
  return theme === "system" ? (systemDark ? "dark" : "light") : theme;
}
