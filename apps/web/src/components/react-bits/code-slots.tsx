// Adapted from free React Bits CodeSlots-TS-CSS: spring-filled slots, rising digits and caret.
// The native input owns value/selection/autofill; verification remains with the caller.
import { forwardRef, useState, type ChangeEvent, type ComponentProps, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import "./code-slots.css";

type CodeSlotsProps = Omit<ComponentProps<"input">, "value" | "onChange" | "type" | "size"> & {
  value: string;
  onValueChange: (value: string) => void;
  length?: number;
};

export const CodeSlots = forwardRef<HTMLInputElement, CodeSlotsProps>(function CodeSlots(
  { value, onValueChange, length = 6, disabled, className = "", onFocus, onBlur, onSelect, onPaste, ...props },
  ref,
) {
  const reduce = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const clean = (raw: string) => raw.replace(/[^0-9]/g, "").slice(0, length);
  const select = (element: HTMLInputElement) => setActive(Math.min(element.selectionStart ?? value.length, length - 1));
  const change = (event: ChangeEvent<HTMLInputElement>) => {
    onValueChange(clean(event.target.value));
    select(event.target);
  };

  return (
    <div className={`code-slots ${className}`} style={{ "--cs-length": length } as CSSProperties}>
      <div className="code-slots__row" data-focused={focused || undefined}
        data-disabled={disabled || undefined} data-invalid={props["aria-invalid"] || undefined}>
        <input {...props} ref={ref} className="code-slots__input" type="text" inputMode="numeric" autoComplete="one-time-code"
          pattern={`[0-9]{${length}}`} maxLength={length} value={value} disabled={disabled}
          spellCheck={false} autoCapitalize="off"
          onChange={change}
          onFocus={event => { setFocused(true); select(event.currentTarget); onFocus?.(event); }}
          onBlur={event => { setFocused(false); onBlur?.(event); }}
          onSelect={event => { select(event.currentTarget); onSelect?.(event); }}
          onClick={event => {
            const element = event.currentTarget;
            const bounds = element.getBoundingClientRect();
            const index = Math.max(0, Math.min(Math.floor((event.clientX - bounds.left) / (bounds.width / length)), value.length, length - 1));
            element.setSelectionRange(index, Math.min(index + 1, value.length));
            select(element);
          }}
          onPaste={event => {
            onPaste?.(event);
            if (event.defaultPrevented) return;
            const pasted = clean(event.clipboardData.getData("text"));
            if (!pasted) { event.preventDefault(); return; }
            // A complete OTP replaces the complete value even when a slot is selected.
            if (pasted.length === length) {
              event.preventDefault();
              event.currentTarget.value = pasted;
              onValueChange(pasted);
              setActive(length - 1);
              event.currentTarget.setSelectionRange(length, length);
            }
          }}
        />
        {Array.from({ length }, (_, index) => {
          const char = value[index] ?? "";
          return (
            <span key={index} className="code-slots__slot" aria-hidden="true"
              data-active={focused && active === index || undefined} data-filled={!!char || undefined}>
              <motion.span className="code-slots__fill" initial={false}
                animate={{ scale: char ? 1 : 0 }}
                transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.3, bounce: 0.2 }} />
              {char && <motion.span key={char} className="code-slots__digit"
                initial={reduce ? false : { y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.3, bounce: 0.2 }}>
                {char}
              </motion.span>}
              {focused && active === index && !char && !disabled && <span className="code-slots__caret" />}
            </span>
          );
        })}
      </div>
    </div>
  );
});
