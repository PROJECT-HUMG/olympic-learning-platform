import type { ReactNode } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { User, Calendar } from "lucide-react";
import type { UserProfile } from "@/features/user/types/user.types";

interface UserHoverCardProps {
  user: UserProfile;
  children: ReactNode;
  align?: "start" | "center" | "end";
}

export function UserHoverCard({ user, children, align = "start" }: UserHoverCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent align={align} className="w-72 shadow-xl border-border/50 z-50" onClick={(e) => e.preventDefault()}>
        <div className="flex space-x-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 shrink-0 shadow-sm border border-border/50">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName || "User"} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-primary">
                {(user.fullName || "U")[0]}
              </div>
            )}
          </div>
          <div className="space-y-1.5 flex-1">
            <h4 className="text-sm font-bold leading-none">{user.fullName || user.username}</h4>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="size-3" /> @{user.username}
            </p>
            <div className="flex flex-col gap-1.5 pt-2 border-t border-border/40 mt-2">
              <Badge variant="secondary" className="w-fit text-[10px] uppercase tracking-wider">
                {user.role === "ADMIN" ? "Quản trị viên" : user.role === "LECTURER" ? "Giảng viên" : "Sinh viên"}
              </Badge>
              {user.lastLoginAt && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3" /> Hoạt động: {formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true, locale: vi })}
                </p>
              )}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
