"use client";

// Kokonut Team Selector4.0.0 (MIT, @dorianbaffier): real avatar stack with its
// spring entry/exit and position layout. The meaningful local choice is presence
// filtering, not purchasing/scrubbing invented seats or selecting fictional teams.
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MemberAvatar, type AvatarMember } from "./avatar-picker";

export default function TeamSelector({ members, value, onChange }: { members: AvatarMember[]; value: "all" | "online"; onChange: (value: "all" | "online") => void }) {
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  const shown = value === "online" ? members.filter(member => member.online) : members;
  const visible = shown.slice(0, 4), overflow = Math.max(0, shown.length - visible.length);
  return <MotionConfig reducedMotion="never"><div className="room-team-selector">
    <div className="room-team-stack" aria-hidden="true"><AnimatePresence initial={false} mode="popLayout">
      {visible.map((member, index) => <motion.span key={member.id} layout="position" initial={reduce ? false : "hidden"} animate="visible" exit="hidden"
        variants={{ visible: { opacity: 1, scale: 1, transition: reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 28, mass: .6 } }, hidden: { opacity: 0, scale: reduce ? 1 : .85, transition: { duration: reduce ? 0 : .16 } } }}
        transition={{ layout: { duration: reduce ? 0 : .2, ease: [.23, 1, .32, 1] } }} style={{ zIndex: 5 - index }}><MemberAvatar member={member} /></motion.span>)}
      {overflow > 0 && <motion.span key="overflow" className="room-team-stack__more" layout="position" initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>+{overflow}</motion.span>}
    </AnimatePresence></div>
    <div className="room-team-filter" role="group" aria-label="Hiển thị thành viên">
      <button type="button" aria-pressed={value === "all"} onClick={() => onChange("all")}>Tất cả <span>{members.length}</span></button>
      <button type="button" aria-pressed={value === "online"} onClick={() => onChange("online")}>Có mặt <span>{members.filter(member => member.online).length}</span></button>
    </div>
  </div></MotionConfig>;
}
