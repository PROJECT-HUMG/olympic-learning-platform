"use client";

// Adapted from official @kokonutui/avatar-picker 2.0.0 (MIT, @dorianbaffier).
// The selectable avatar slots use real identities, never editable/generated faces or a 3D coin.
import { useState } from "react";
import { Crown } from "lucide-react";
import { AvatarImage } from "@/features/user/components/avatar-image";
import type { AvatarCrop } from "@/features/user/types/user.types";
import { cn } from "@/lib/utils";

export interface AvatarMember {
  id: string;
  name: string;
  avatarUrl?: string | null;
  avatarCrop?: AvatarCrop | null;
  detail: string;
  isHost?: boolean;
  isSelf?: boolean;
}

export function MemberAvatar({ member, className }: { member: Pick<AvatarMember, "id" | "name" | "avatarUrl" | "avatarCrop">; className?: string }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const initials = member.name.trim().split(/\s+/).slice(-2).map(word => Array.from(word)[0]).join("").toLocaleUpperCase("vi") || "?";
  return <span className={cn("room-member-avatar", className)} aria-hidden="true">
    {member.avatarUrl && failedUrl !== member.avatarUrl
      ? <AvatarImage src={member.avatarUrl} crop={member.avatarCrop} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailedUrl(member.avatarUrl!)} />
      : initials}
  </span>;
}

export default function AvatarPicker({ members, onSelect }: { members: AvatarMember[]; onSelect: (member: AvatarMember, opener: HTMLButtonElement) => void }) {
  return <ul className="room-member-list" aria-label="Thành viên phòng học">
    {members.map(member => <li key={member.id}>
      <button type="button" className="room-member-button" onClick={event => onSelect(member, event.currentTarget)} aria-haspopup="dialog">
        <MemberAvatar member={member} />
        <span className="room-member-identity"><strong>{member.name}{member.isSelf && <span> (bạn)</span>}</strong><small>{member.detail}</small></span>
        {member.isHost && <Crown className="room-member-crown" aria-label="Chủ phòng" />}
      </button>
    </li>)}
  </ul>;
}
