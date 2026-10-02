import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Coffee, Sparkles, X } from "lucide-react";
import type { CSSProperties } from "react";
import type { PhaseNotice } from "../lib/phase-feedback";

export function PhaseCelebration({ notice, onDismiss }: { notice: PhaseNotice | null; onDismiss: () => void }) {
  const reduceMotion = useReducedMotion();
  return <>
    {notice && <div className="room-phase-sparks" key={`sparks-${notice.id}`} aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => <i key={index} style={{ "--spark-angle": `${index * 30}deg`, "--spark-delay": `${index % 3 * .06}s` } as CSSProperties} />)}
    </div>}
    <AnimatePresence>
      {notice && <motion.div className="room-phase-celebration" data-kind={notice.kind} key={notice.id} role="status"
        initial={reduceMotion ? false : { opacity: 0, y: 12, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .25 }}>
        <span className="room-phase-celebration__icon">{notice.kind === "focus-complete" ? <Sparkles aria-hidden="true" /> : <Coffee aria-hidden="true" />}</span>
        <div><strong>{notice.title}</strong><p>{notice.description}</p></div>
        <button type="button" onClick={onDismiss} aria-label="Ẩn thông báo chuyển phiên"><X aria-hidden="true" /></button>
      </motion.div>}
    </AnimatePresence>
  </>;
}
