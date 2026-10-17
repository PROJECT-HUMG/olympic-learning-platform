"use client";

// Kokonut Avatar Picker2.0.0, MIT @dorianbaffier: retain the bezel, selectable
// sockets, shared avatar flight and roving keys. Real members replace generated
// faces; picking inspects a person and never changes anybody's profile.
import { useId, useRef, useState } from "react";
import { LayoutGroup, MotionConfig, motion } from "framer-motion";
import { Crown } from "lucide-react";
import { AvatarImage } from "@/features/user/components/avatar-image";
import type { AvatarCrop } from "@/features/user/types/user.types";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export interface AvatarMember {
  id: string;
  name: string;
  avatarUrl?: string | null;
  avatarCrop?: AvatarCrop | null;
  detail: string;
  focusSeconds: number;
  online: boolean;
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

const BEZEL = 144;
const FLY = { type: "spring", bounce: .18, visualDuration: .45 } as const;
const TICKS = Array.from({ length: 40 }, (_, index) => {
  const angle = index / 40 * Math.PI * 2, long = index % 5 === 0;
  const outer = BEZEL / 2 - 3, inner = outer - (long ? 7 : 4), c = BEZEL / 2;
  const round = (value: number) => Math.round(value * 100) / 100;
  return { x1: round(c + Math.sin(angle) * inner), y1: round(c - Math.cos(angle) * inner), x2: round(c + Math.sin(angle) * outer), y2: round(c - Math.cos(angle) * outer), long };
});

export default function AvatarPicker({ members, selectedId, onSelect }: { members: AvatarMember[]; selectedId: string; onSelect: (id: string) => void }) {
  const id = useId(), reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const selected = members.find(member => member.id === selectedId) ?? members[0];
  if (!selected) return null;
  const choose = (index: number) => {
    const member = members[(index + members.length) % members.length];
    onSelect(member.id);
    const button = buttons.current.get(member.id);
    button?.focus({ preventScroll: true });
    button?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  };
  // Keep projection IDs stable; this installed Motion version registers them at mount.
  // The live project media hook owns zero-duration transitions and the CSS stop rule.
  return <MotionConfig reducedMotion="never"><LayoutGroup id={id}>
    <div className="room-avatar-picker" data-selected-member={selected.id}>
      <div className="room-avatar-main">
        <div className="room-avatar-bezel" aria-hidden="true">
          <svg viewBox={`0 0 ${BEZEL} ${BEZEL}`} focusable="false">{TICKS.map(({ long, ...tick }, index) => <line key={index} {...tick} stroke="currentColor" strokeWidth={long ? 1.5 : 1} />)}</svg>
          <motion.span className="room-avatar-selected" key={selected.id} layoutId={`face-${selected.id}`} transition={reduce ? { duration: 0 } : FLY}><MemberAvatar member={selected} /></motion.span>
        </div>
        <div className="room-avatar-detail" role="status" aria-live="polite" aria-atomic="true">
          <h3>{selected.name}{selected.isSelf && <span> (bạn)</span>}</h3>
          <p>{selected.isHost && <><Crown aria-hidden="true" />Chủ phòng · </>}{selected.detail}</p>
          <strong>{Math.floor(selected.focusSeconds / 60)} phút tập trung</strong>
          <small>Thời gian được phòng ghi nhận khi còn kết nối.</small>
        </div>
      </div>
      <div className="room-avatar-options" role="toolbar" aria-label="Chọn bạn cùng học để xem thông tin">
        {members.map((member, index) => {
          const active = member.id === selected.id;
          return <button key={member.id} ref={button => { if (button) buttons.current.set(member.id, button); else buttons.current.delete(member.id); }}
            type="button" className="room-member-button room-avatar-option" aria-label={`${member.name}${member.isSelf ? " (bạn)" : ""} · ${member.detail}`} aria-pressed={active} tabIndex={active ? 0 : -1}
            onClick={() => onSelect(member.id)} onKeyDown={event => {
              const targets: Record<string, number> = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1, Home: 0, End: members.length - 1 };
              if (targets[event.key] === undefined) return;
              event.preventDefault(); choose(targets[event.key]);
            }}>
            <span className="room-avatar-socket" aria-hidden="true">{active ? <span className="room-avatar-index" /> : <motion.span layoutId={`face-${member.id}`} transition={reduce ? { duration: 0 } : FLY}><MemberAvatar member={member} /></motion.span>}</span>
            <span className="room-avatar-option-name">{member.name}</span>
          </button>;
        })}
      </div>
      <p className="room-avatar-hint">Chọn một người để xem thông tin · dùng phím mũi tên hoặc vuốt danh sách.</p>
    </div>
  </LayoutGroup></MotionConfig>;
}
