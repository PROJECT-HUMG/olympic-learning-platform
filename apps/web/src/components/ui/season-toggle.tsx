import { Button } from "@/components/ui/button";
import { useSeasonStore, type Season } from "@/stores/use-season-store";
import { Leaf, Snowflake, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function SeasonToggle() {
  const { currentSeason, setSeason } = useSeasonStore();

  const seasons: { value: Season; label: string; Icon: React.ElementType }[] = [
    { value: "autumn", label: "Mùa Thu", Icon: Leaf },
    { value: "winter", label: "Mùa Đông", Icon: Snowflake },
    { value: "off", label: "Tắt hiệu ứng", Icon: CloudOff },
  ];

  const current = seasons.find((s) => s.value === currentSeason) || seasons[2]; // Default to off if not found

  const handleToggle = () => {
    const currentIndex = seasons.findIndex((s) => s.value === currentSeason);
    // If currentSeason is something else (e.g. spring/summer from old state), start from 0
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % seasons.length;
    setSeason(seasons[nextIndex].value);
  };

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={handleToggle}
      aria-label={current.label}
      title={current.label}
      className="rounded-full border-border/80 shadow-xs relative overflow-hidden group"
    >
      <current.Icon 
        key={currentSeason} 
        className={cn(
          "size-5 transition-all duration-500 group-hover:scale-110 animate-in zoom-in-50 spin-in-90 fade-in-0 text-muted-foreground group-hover:text-foreground"
        )} 
      />
      <span className="sr-only">{current.label}</span>
    </Button>
  );
}
