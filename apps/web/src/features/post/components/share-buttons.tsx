import { Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import SocialButton, { type ShareItem } from "@/components/kokonutui/social-button";
import { cn } from "@/lib/utils";

function FaviconIcon({ name }: { name: string }) {
  return <img src={`/social-icons/${name}.png`} alt="" aria-hidden="true" className="size-4 rounded-sm" loading="lazy" />;
}

interface ShareButtonsProps {
  url: string;
  title: string;
  className?: string;
  direction?: "vertical" | "horizontal";
}

export function ShareButtons({ url, title, className, direction = "vertical" }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Đã sao chép liên kết");
    } catch {
      toast.error("Không thể sao chép liên kết");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator.share !== "function") return;
    try {
      await navigator.share({ title, url });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        toast.error("Không thể chia sẻ. Bạn có thể sao chép liên kết.");
      }
    }
  };

  const items: ShareItem[] = [
    { label: "Sao chép liên kết", icon: <Link2 aria-hidden="true" className="size-4" />, onClick: () => void handleCopyLink() },
    { label: "Chia sẻ lên Facebook (mở cửa sổ mới)", icon: <FaviconIcon name="facebook" />, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: "Chia sẻ lên X (mở cửa sổ mới)", icon: <FaviconIcon name="x" />, href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { label: "Chia sẻ lên LinkedIn (mở cửa sổ mới)", icon: <FaviconIcon name="linkedin" />, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { label: "Chia sẻ lên Telegram (mở cửa sổ mới)", icon: <FaviconIcon name="telegram" />, href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}` },
  ];
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    items.push({ label: "Chia sẻ bằng ứng dụng trên thiết bị", icon: <Share2 aria-hidden="true" className="size-4" />, onClick: () => void handleNativeShare() });
  }

  return <div className={cn("max-w-full", direction === "vertical" && "w-full", className)}>
    <SocialButton items={items} />
  </div>;
}
