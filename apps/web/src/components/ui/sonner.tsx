import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react";
import { useResolvedTheme } from "@/hooks/use-resolved-theme";
import { cn } from "@/lib/utils";
import "./sonner.css";

const Toaster = ({ className, toastOptions, ...props }: ToasterProps) => {
  const theme = useResolvedTheme();

  return (
    <Sonner
      theme={theme}
      className={cn("toaster group olympic-toaster", className)}
      duration={4000}
      containerAriaLabel="Thông báo"
      mobileOffset={{
        top: "max(1rem, env(safe-area-inset-top))",
        bottom: "max(1rem, env(safe-area-inset-bottom))",
        left: "max(1rem, env(safe-area-inset-left), env(safe-area-inset-right))",
        right: "max(1rem, env(safe-area-inset-left), env(safe-area-inset-right))",
      }}
      icons={{
        success: <CheckIcon aria-hidden="true" />,
        info: <InfoIcon aria-hidden="true" />,
        warning: <TriangleAlertIcon aria-hidden="true" />,
        error: <OctagonXIcon aria-hidden="true" />,
        loading: <Loader2Icon aria-hidden="true" className="animate-spin motion-reduce:animate-none" />,
      }}
      toastOptions={{
        closeButtonAriaLabel: "Đóng thông báo",
        ...toastOptions,
        classNames: {
          toast: "toast olympic-toast",
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
