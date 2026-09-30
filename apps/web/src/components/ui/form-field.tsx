import * as React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import "./label-input.css";

export interface FormFieldProps extends React.ComponentProps<"input"> {
  id: string;
  label?: string;
  labelRight?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string;
  required?: boolean;
  showAsterisk?: boolean;
  /** SVG corner radius — at half the height it is a pill */
  corner?: number;
  /** Optional element rendered at the end of the input (e.g. submit button, action icon) */
  endAdornment?: React.ReactNode;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/* The box height matches the CSS .lbi-box height */
const H = 52;
/* the lifted label's size, against its resting one */
const S = 0.78;
/* the stroke sits half a stroke inside the box */
const IN = 0.75;

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      id,
      label,
      labelRight,
      helperText,
      error,
      required,
      showAsterisk = false,
      placeholder: _placeholder,
      className,
      type,
      corner = 14,
      endAdornment,
      onChange,
      onFocus,
      onBlur,
      value: controlledValue,
      defaultValue,
      ...props
    },
    ref,
  ) => {
    const r = clamp(corner, 0, H / 2);
    const isPassword = type === "password";

    const [focus, setFocus] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [flip, setFlip] = useState(0);

    /* Track whether the field has a value for the "up" state.
       We read the actual DOM value so it works with both
       controlled (RHF) and uncontrolled usage. */
    const innerRef = useRef<HTMLInputElement | null>(null);
    const [hasValue, setHasValue] = useState(false);

    const syncRef = (el: HTMLInputElement | null) => {
      innerRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
    };

    /* the notch is the label's own width, so it is measured */
    const lab = useRef<HTMLLabelElement | null>(null);
    const [lw, setLw] = useState(40);
    useLayoutEffect(() => {
      if (lab.current) setLw(lab.current.offsetWidth);
    }, [label]);

    /* Measure the container width for SVG viewBox */
    const boxRef = useRef<HTMLDivElement | null>(null);
    const [boxW, setBoxW] = useState(280);
    useLayoutEffect(() => {
      if (!boxRef.current) return;
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setBoxW(entry.contentRect.width);
        }
      });
      observer.observe(boxRef.current);
      setBoxW(boxRef.current.offsetWidth);
      return () => observer.disconnect();
    }, []);

    const up = focus || hasValue;

    const inputType = isPassword
      ? showPassword
        ? "text"
        : "password"
      : type;

    /* ── SVG outline geometry ────────────────────────── */
    const W = boxW;
    const lx = Math.max(14, r + 4);
    const x0 = Math.max(r * 0.6, lx - 5);
    const x1 = lx + lw * S + 5;
    const a = r - IN;
    const R = W - IN;
    const B = H - IN;
    const mid = W / 2;
    const nm = (x0 + x1) / 2;
    const gapL = `M${nm},${IN} L${x0},${IN}`;
    const gapR = `M${nm},${IN} L${x1},${IN}`;
    const right =
      r > 0
        ? `M${x1},${IN} L${W - r},${IN} A${a},${a} 0 0 1 ${R},${r} L${R},${H - r} A${a},${a} 0 0 1 ${W - r},${B} L${mid},${B}`
        : `M${x1},${IN} L${R},${IN} L${R},${B} L${mid},${B}`;
    const left =
      r > 0
        ? `M${x0},${IN} L${r},${IN} A${a},${a} 0 0 0 ${IN},${r} L${IN},${H - r} A${a},${a} 0 0 0 ${r},${B} L${mid},${B}`
        : `M${x0},${IN} L${IN},${IN} L${IN},${B} L${mid},${B}`;

    const helperId = helperText ? `${id}-helper` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy =
      [errorId, helperId].filter(Boolean).join(" ") || undefined;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocus(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocus(false);
      setHasValue(Boolean(e.target.value));
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(Boolean(e.target.value));
      onChange?.(e);
    };

    const reveal = () => {
      setShowPassword((s) => !s);
      setFlip((f) => f + 1);
    };

    return (
      <div className="space-y-1.5 relative">
        <div
          className="lbi"
          data-up={up}
          data-focus={focus}
          data-filled={hasValue}
          data-invalid={Boolean(error)}
        >
          {labelRight && <div className="lbi-label-right">{labelRight}</div>}

          <div
            ref={boxRef}
            className="lbi-box"
            style={
              {
                borderRadius: r,
                "--lbi-x": `${lx}px`,
              } as React.CSSProperties
            }
          >
            <svg
              className="lbi-ring"
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d={right} />
              <path d={left} />
              <path className="lbi-gap" d={gapL} pathLength={1} />
              <path className="lbi-gap" d={gapR} pathLength={1} />
            </svg>

            {label && (
              <label className="lbi-label" htmlFor={id} ref={lab}>
                {[...label].map((ch, i) => (
                  <span
                    key={i}
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    {ch === " " ? "\u00A0" : ch}
                  </span>
                ))}
                {showAsterisk && required && (
                  <span
                    className="text-destructive ml-0.5"
                    aria-hidden="true"
                  >
                    *
                  </span>
                )}
              </label>
            )}

            <input
              ref={syncRef}
              id={id}
              className={cn("lbi-field", className)}
              data-flip={flip % 2}
              type={inputType}
              required={required}
              aria-invalid={Boolean(error)}
              aria-describedby={describedBy}
              value={controlledValue}
              defaultValue={defaultValue}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoComplete="off"
              spellCheck={false}
              style={{ paddingRight: isPassword ? 48 : endAdornment ? 52 : lx }}
              {...props}
            />

            {endAdornment ? (
              <div className="lbi-end-adornment">{endAdornment}</div>
            ) : isPassword ? (
              <button
                className="lbi-eye"
                type="button"
                data-show={showPassword}
                onPointerDown={(e) => e.preventDefault()}
                onClick={reveal}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                <Eye size={16} strokeWidth={2} aria-hidden="true" />
                <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <p id={errorId} role="alert" className="text-xs text-destructive">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-muted-foreground">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

FormField.displayName = "FormField";
