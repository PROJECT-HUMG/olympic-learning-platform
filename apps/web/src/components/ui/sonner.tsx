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
          <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-500 mr-3 shrink-0">
            <CheckIcon className="size-3.5 stroke-[3]" />
          </div>
        ),
        info: (
          <div className="flex size-6 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-500 mr-3 shrink-0">
            <InfoIcon className="size-3.5 stroke-[3]" />
          </div>
        ),
        warning: (
          <div className="flex size-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-500 mr-3 shrink-0">
            <TriangleAlertIcon className="size-3.5 stroke-[3]" />
          </div>
        ),
        error: (
          <div className="flex size-6 items-center justify-center rounded-full bg-destructive/15 text-destructive dark:text-destructive mr-3 shrink-0">
            <OctagonXIcon className="size-3.5 stroke-[3]" />
          </div>
        ),
        loading: <Loader2Icon className="size-4 shrink-0 animate-spin text-primary mr-3" role="progressbar" aria-label="Đang xử lý" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast !font-sans !bg-card !text-foreground !border !border-border !rounded-xl !shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-[14px] font-medium p-4 py-3 min-h-12 items-center gap-1.5 w-full flex !pr-11",
          description: "!text-muted-foreground",
          actionButton:
            "!bg-transparent !text-blue-600 dark:!text-blue-400 font-semibold hover:!bg-blue-500/10 transition-colors ml-auto px-3 rounded-md h-8",
          cancelButton:
            "!bg-muted !text-muted-foreground font-medium",
          closeButton:
            "!absolute !left-auto !right-2 !top-1/2 !-translate-y-1/2 !bg-transparent !text-muted-foreground/60 hover:!text-foreground hover:!bg-muted !border-none !p-1.5 !m-0 !transition-colors cursor-pointer flex items-center justify-center !size-7 [&>svg]:!size-4",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
