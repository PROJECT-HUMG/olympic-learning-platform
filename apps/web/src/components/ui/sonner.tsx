import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={4000}
      icons={{
        success: <CircleCheckIcon className="size-4 shrink-0 text-emerald-500" />,
        info: <InfoIcon className="size-4 shrink-0 text-blue-500" />,
        warning: <TriangleAlertIcon className="size-4 shrink-0 text-amber-500" />,
        error: <OctagonXIcon className="size-4 shrink-0 text-destructive" />,
        loading: <Loader2Icon className="size-4 shrink-0 animate-spin text-primary" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:font-sans group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:rounded-xl group-[.toaster]:shadow-lg text-sm pr-8",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-medium",
          closeButton:
            "group-[.toast]:bg-transparent group-[.toast]:text-muted-foreground group-[.toast]:hover:text-foreground group-[.toast]:hover:bg-muted group-[.toast]:border-none group-[.toast]:top-2.5 group-[.toast]:right-2.5 group-[.toast]:left-auto group-[.toast]:transform-none group-[.toast]:transition-colors cursor-pointer",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
