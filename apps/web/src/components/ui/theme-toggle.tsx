import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/stores/use-theme-store";

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label="Đổi giao diện"
      title="Đổi giao diện"
      className="rounded-full relative text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer border-border/80 shadow-xs"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Đổi giao diện</span>
    </Button>
  );
}
