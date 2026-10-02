import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useHomeMotion } from "@/features/home/hooks/use-home-motion";
import { useResolvedTheme } from "@/hooks/use-resolved-theme";
import { useThemeStore } from "@/stores/use-theme-store";

export function PublicDisplaySettings({ home }: { home: boolean }) {
  const id = useId();
  const theme = useResolvedTheme();
  const setTheme = useThemeStore((state) => state.setTheme);
  const { enabled, setEnabled } = useHomeMotion();

  return (
    <section className="public-display-settings" aria-labelledby={id + "-title"}>
      <h2 id={id + "-title"}>Hiển thị</h2>
      <div className="public-display-settings__options">
        <Label htmlFor={id + "-theme"}>
          Giao diện tối
          <Switch id={id + "-theme"} checked={theme === "dark"}
            onCheckedChange={(dark) => setTheme(dark ? "dark" : "light")} />
        </Label>
        {home && <Label htmlFor={id + "-motion"}>
          Nền động
          <Switch id={id + "-motion"} checked={enabled} onCheckedChange={setEnabled} />
        </Label>}
      </div>
    </section>
  );
}
