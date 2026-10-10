import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./user-avatar";
import { usePublicProfile } from "../hooks/use-public-profile";
import { hasUuidFormat } from "@/lib/uuid";
import { publicProfilePath } from "../lib/public-identity";
import type { PublicUserIdentity } from "../types/user.types";
import "./public-profile.css";

export function UserIdentity({ user, from }: {
  user: PublicUserIdentity; from?: string;
}) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const profile = usePublicProfile(user.id, open);
  const name = user.fullName || user.username || "Thành viên";
  const content = <><UserAvatar user={user} /><span>{name}</span></>;
  // Historical/unavailable accounts retain attribution without a misleading profile link.
  if (user.profileAvailable === false || !hasUuidFormat(user.id)) return <span className="user-identity">{content}</span>;
  return <HoverCard open={open} onOpenChange={setOpen} openDelay={250} closeDelay={150}>
    <HoverCardTrigger asChild><Link className="user-identity" to={publicProfilePath(user.id)}
      onClick={event => event.stopPropagation()} state={{ from: from ?? location.pathname + location.search }} aria-label={`Xem hồ sơ ${name}`}>{content}</Link></HoverCardTrigger>
    <HoverCardContent className="identity-preview" align="start" collisionPadding={12}>
      {profile.isPending || profile.isFetching ? <p role="status">Đang tải hồ sơ…</p>
        : profile.isError ? <div role="alert"><p>Hồ sơ chưa khả dụng. Hãy thử lại.</p><Button variant="outline" size="sm" loading={profile.isFetching} onClick={() => void profile.refetch()}>Thử lại</Button></div>
        : profile.data ? <>
          <div className="identity-preview__heading"><UserAvatar user={profile.data} className="user-avatar--preview" /><div><p className="font-semibold">{profile.data.fullName}</p><p className="text-muted-foreground">@{profile.data.username}</p></div></div>
          <p className="identity-preview__summary">{profile.data.achievements.length} thành tích công khai đã duyệt · {profile.data.publicPoints} điểm nền tảng</p>
          {profile.data.achievements[0] && <p className="identity-preview__latest">Gần nhất: {profile.data.achievements[0].title}</p>}
          <p className="text-xs text-muted-foreground">Nhấn tên để mở hồ sơ đầy đủ.</p>
        </> : null}
    </HoverCardContent>
  </HoverCard>;
}
