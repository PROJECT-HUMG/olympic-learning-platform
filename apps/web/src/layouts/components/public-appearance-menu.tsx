import { Moon, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHomeMotion } from "@/features/home/hooks/use-home-motion";
import { useResolvedTheme } from "@/hooks/use-resolved-theme";
import { useThemeStore } from "@/stores/use-theme-store";

export function PublicAppearanceMenu({ home }: { home: boolean }) {
  const theme = useResolvedTheme();
  const setTheme = useThemeStore((state) => state.setTheme);
  const { enabled, setEnabled } = useHomeMotion();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="public-header__icon"
          aria-label="Tùy chọn hiển thị" title="Tùy chọn hiển thị">
          <SlidersHorizontal aria-hidden="true" className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56 max-w-[calc(100vw-2rem)] p-2">
        <DropdownMenuLabel>Hiển thị</DropdownMenuLabel>
        <DropdownMenuCheckboxItem className="min-h-11 gap-2" checked={theme === "dark"}
          onCheckedChange={(dark) => setTheme(dark ? "dark" : "light")}
          onSelect={(event) => event.preventDefault()}>
          <Moon aria-hidden="true" />Giao diện tối
        </DropdownMenuCheckboxItem>
        {home && <DropdownMenuCheckboxItem className="min-h-11 gap-2" checked={enabled}
          onCheckedChange={setEnabled} onSelect={(event) => event.preventDefault()}>
          <Sparkles aria-hidden="true" />Nền động
        </DropdownMenuCheckboxItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
