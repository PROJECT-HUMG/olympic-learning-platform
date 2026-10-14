// Adapted from @kokonutui/profile-dropdown, retrieved through shadcn MCP.
// Keep the registry's grouped profile/actions presentation; use existing Radix,
// React Router and HUMG tokens instead of Next.js, sample identity or billing.
import type { ReactElement, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ProfileMenuItem {
  label: string;
  href: string;
  icon: ReactNode;
}

interface ProfileDropdownProps {
  data: { name: string; email: string; context: string };
  avatar: ReactNode;
  trigger: ReactElement;
  items: ProfileMenuItem[];
  onSignOut: () => void;
  side: "top" | "bottom";
}

export default function ProfileDropdown({ data, avatar, trigger, items, onSignOut, side }: ProfileDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align="end"
        sideOffset={8}
        collisionPadding={8}
        className="shell-account-menu w-72 max-w-[calc(100vw-2rem)] rounded-xl p-2"
        onFocusCapture={(event) => {
          if (!(event.target instanceof HTMLElement) || event.target.getAttribute("role") !== "menuitem") return;
          const item = event.target.getBoundingClientRect();
          const menu = event.currentTarget.getBoundingClientRect();
          if (item.top < menu.top || item.bottom > menu.bottom) event.target.scrollIntoView({ block: "nearest" });
        }}
      >
        <DropdownMenuLabel className="flex min-w-0 items-start gap-3 p-2 pb-3">
          {avatar}
          <span className="min-w-0 flex-1">
            <span title={data.name} className="line-clamp-2 break-words text-sm font-semibold text-foreground [overflow-wrap:anywhere]">{data.name}</span>
            <span title={data.email} className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">{data.email}</span>
            <span className="mt-1.5 block text-xs font-normal text-muted-foreground">{data.context}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mx-0" />
        <div className="space-y-1 py-1">
          {items.map((item) => (
            <DropdownMenuItem asChild key={item.href} className="group min-h-11 cursor-pointer gap-3 rounded-lg px-2 font-medium">
              <Link to={item.href}>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-focus:bg-primary/10 group-focus:text-primary">{item.icon}</span>
                <span className="min-w-0 flex-1 break-words">{item.label}</span>
                <ChevronRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator className="mx-0" />
        <DropdownMenuItem asChild variant="destructive" onSelect={onSignOut} className="mt-1 min-h-11 w-full cursor-pointer gap-3 rounded-lg bg-destructive/5 px-2 font-medium">
          <button type="button"><LogOut aria-hidden="true" />Đăng xuất</button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
