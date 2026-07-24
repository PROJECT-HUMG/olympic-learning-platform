import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/stores/use-theme-store";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  const Icon = theme === "dark" ? Moon : Sun;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label="Đổi giao diện"
      title="Đổi giao diện"
      className="rounded-full relative overflow-hidden group border-border/80 shadow-xs"
    >
      <Icon 
        key={theme} 
        className={cn(
          "size-5 transition-all duration-500 group-hover:scale-110 animate-in zoom-in-50 spin-in-90 fade-in-0 text-muted-foreground group-hover:text-foreground"
        )} 
      />
      <span className="sr-only">Đổi giao diện</span>
    </Button>
  );
}
