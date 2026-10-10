import { useState } from "react";
import { AvatarImage } from "./avatar-image";
import { identityInitials } from "../lib/public-identity";
import type { PublicUserIdentity } from "../types/user.types";
import { cn } from "@/lib/utils";

export function UserAvatar({ user, className }: { user: Pick<PublicUserIdentity, "fullName" | "username" | "avatarUrl" | "avatarCrop">; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const name = user.fullName || user.username;
  return <span aria-hidden="true" className={cn("user-avatar", className)}>
    {user.avatarUrl && failed !== user.avatarUrl
      ? <AvatarImage src={user.avatarUrl} crop={user.avatarCrop} alt="" className="size-full" onError={() => setFailed(user.avatarUrl!)} />
      : identityInitials(name)}
  </span>;
}
