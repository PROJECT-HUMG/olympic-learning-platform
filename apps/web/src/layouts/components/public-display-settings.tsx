import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useResolvedTheme } from "@/hooks/use-resolved-theme";
import { useThemeStore } from "@/stores/use-theme-store";

export function PublicDisplaySettings() {
  const id = useId();
  const theme = useResolvedTheme();
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <section className="public-display-settings" aria-labelledby={id + "-title"}>
      <h2 id={id + "-title"} className="sr-only">Hiển thị</h2>
      <div className="public-display-settings__options">
        <Label htmlFor={id + "-theme"}>
          Giao diện tối
          <Switch id={id + "-theme"} checked={theme === "dark"}
            onCheckedChange={(dark) => setTheme(dark ? "dark" : "light")} />
        </Label>
      </div>
    </section>
  );
}
