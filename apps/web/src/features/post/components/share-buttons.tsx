import { Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function FaviconIcon({ domain, className }: { domain: string; className?: string }) {
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={`${domain} icon`}
      className={className}
      loading="lazy"
    />
  );
}

interface ShareButtonsProps {
  url: string;
  title: string;
  className?: string;
  direction?: "vertical" | "horizontal";
}

interface ShareAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export function ShareButtons({
  url,
  title,
  className,
  direction = "vertical",
}: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const openShareWindow = (shareUrl: string) => {
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Đã sao chép liên kết");
    } catch {
      toast.error("Không thể sao chép liên kết");
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title, url });
    } catch {
      // User cancelled share — do nothing
    }
  };

  const actions: ShareAction[] = [
    {
      label: "Sao chép liên kết",
      icon: <Link2 className="h-4 w-4" />,
      onClick: handleCopyLink,
    },
    {
      label: "Facebook",
      icon: <FaviconIcon domain="facebook.com" className="size-4 rounded-sm" />,
      onClick: () =>
        openShareWindow(
          `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        ),
    },
    {
      label: "X (Twitter)",
      icon: <FaviconIcon domain="x.com" className="size-4 rounded-sm" />,
      onClick: () =>
        openShareWindow(
          `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
        ),
    },
    {
      label: "LinkedIn",
      icon: <FaviconIcon domain="linkedin.com" className="size-4 rounded-sm" />,
      onClick: () =>
        openShareWindow(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        ),
    },
    {
      label: "Telegram",
      icon: <FaviconIcon domain="telegram.org" className="size-4 rounded-sm" />,
      onClick: () =>
        openShareWindow(
          `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
        ),
    },
  ];

  const supportsNativeShare =
    typeof navigator !== "undefined" && !!navigator.share;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex gap-1",
          direction === "vertical" ? "flex-col" : "flex-row flex-wrap",
          className
        )}
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Chia sẻ
        </p>

        {actions.map((action) => (
          <Tooltip key={action.label}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={action.onClick}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground active:scale-95"
                aria-label={action.label}
              >
                {action.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent side={direction === "vertical" ? "right" : "top"}>
              {action.label}
            </TooltipContent>
          </Tooltip>
        ))}

        {supportsNativeShare && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground active:scale-95"
                aria-label="Chia sẻ khác"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side={direction === "vertical" ? "right" : "top"}>
              Chia sẻ khác
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
