"use client";

// Adapted from official @kokonutui/team-selector 4.0.0 (MIT, @dorianbaffier).
// Keep the real-member avatar stack; remove purchased seats, count scrubbing and demo identities.
import { MemberAvatar, type AvatarMember } from "./avatar-picker";

export default function TeamSelector({ members }: { members: AvatarMember[] }) {
  const visible = members.slice(0, 4);
  return <div className="room-team-stack" aria-hidden="true">
    {visible.map(member => <MemberAvatar key={member.id} member={member} />)}
    {members.length > visible.length && <span className="room-team-stack__more">+{members.length - visible.length}</span>}
  </div>;
}
