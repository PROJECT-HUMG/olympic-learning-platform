import { Link } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  imageClassName?: string;
}

export function Logo({ className, imageClassName }: LogoProps) {
  return (
    <Link
      to={ROUTES.HOME}
      title="Về trang chủ Olympic HUMG"
      aria-label="Olympic HUMG — Về trang chủ"
      className={cn("group flex items-center transition-colors cursor-pointer", className)}
    >
      <img
        src="/icons.svg"
        alt="Logo Olympic HUMG"
        className={cn(
          "h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-200 motion-reduce:transition-none motion-reduce:transform-none",
          imageClassName
        )}
      />
    </Link>
  );
}
