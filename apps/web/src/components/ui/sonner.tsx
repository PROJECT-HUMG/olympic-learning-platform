import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={4000}
      icons={{
        success: (
          <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-500 mr-1.5 shrink-0">
            <CheckIcon className="size-3.5 stroke-[3]" />
          </div>
        ),
        info: (
          <div className="flex size-6 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-500 mr-1.5 shrink-0">
            <InfoIcon className="size-3.5 stroke-[3]" />
          </div>
        ),
        warning: (
          <div className="flex size-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-500 mr-1.5 shrink-0">
            <TriangleAlertIcon className="size-3.5 stroke-[3]" />
          </div>
        ),
        error: (
          <div className="flex size-6 items-center justify-center rounded-full bg-destructive/15 text-destructive dark:text-destructive mr-1.5 shrink-0">
            <OctagonXIcon className="size-3.5 stroke-[3]" />
          </div>
        ),
        loading: <Loader2Icon className="size-4 shrink-0 animate-spin text-primary mr-1.5" role="progressbar" aria-label="Đang xử lý" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:font-sans group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:rounded-xl group-[.toaster]:shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-[14px] font-medium p-4 py-3 min-h-12 items-center gap-1.5",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-transparent group-[.toast]:text-blue-600 dark:group-[.toast]:text-blue-400 font-semibold group-[.toast]:hover:bg-blue-500/10 transition-colors ml-auto px-3 rounded-md h-8",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-medium",
          closeButton:
            "group-[.toast]:bg-transparent group-[.toast]:text-muted-foreground/60 group-[.toast]:hover:text-foreground group-[.toast]:hover:bg-muted group-[.toast]:border-none group-[.toast]:top-1/2 group-[.toast]:-translate-y-1/2 group-[.toast]:right-2 group-[.toast]:left-auto group-[.toast]:transition-colors cursor-pointer",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
