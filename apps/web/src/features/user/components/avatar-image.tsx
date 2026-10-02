import type { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { AvatarCrop } from "../types/user.types";

export function AvatarImage({ crop, className, ...props }: ImgHTMLAttributes<HTMLImageElement> & { crop?: AvatarCrop | null }) {
  const x = Number.isFinite(crop?.x) ? Math.max(0, Math.min(1, crop!.x)) : .5;
  const y = Number.isFinite(crop?.y) ? Math.max(0, Math.min(1, crop!.y)) : .5;
  const zoom = Number.isFinite(crop?.zoom) ? Math.max(1, Math.min(3, crop!.zoom)) : 1;
  const position = x * 100 + "% " + y * 100 + "%";
  return <span className={cn("relative inline-block overflow-hidden align-middle", className ?? "size-full")}>
    <img {...props} style={{ ...props.style, display: "block", width: "100%", height: "100%", maxWidth: "none",
      objectFit: "cover", objectPosition: position, transform: "scale(" + zoom + ")", transformOrigin: position }} />
  </span>;
}
