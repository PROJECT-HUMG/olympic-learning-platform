import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/stores/use-theme-store";
import { cn } from "@/lib/utils";
import { useResolvedTheme } from "@/hooks/use-resolved-theme";

export function ThemeToggle({ className }: { className?: string }) {
  const setTheme = useThemeStore((state) => state.setTheme);
  const theme = useResolvedTheme();

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
      aria-pressed={theme === "dark"}
      title={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      className={cn("size-11 rounded-full relative overflow-hidden group border-border/80 shadow-xs", className)}
    >
      <Icon 
        key={theme} 
        className={cn(
          "size-5 transition-all duration-500 group-hover:scale-110 animate-in zoom-in-50 spin-in-90 fade-in-0 text-muted-foreground group-hover:text-foreground motion-reduce:animate-none motion-reduce:transition-none"
        )} 
      />
      <span className="sr-only">Đổi giao diện</span>
    </Button>
  );
}
