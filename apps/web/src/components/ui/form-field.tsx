import * as React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EyeIcon, EyeOffIcon } from "lucide-react";

export interface FormFieldProps extends React.ComponentProps<"input"> {
  id: string;
  label?: React.ReactNode;
  labelRight?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string;
  required?: boolean;
  showAsterisk?: boolean;
}

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
      placeholder,
      className,
      type,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    const helperId = helperText ? `${id}-helper` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="space-y-1.5">
        {(label || labelRight) && (
          <div className="flex items-center justify-between">
            {label ? (
              <label
                htmlFor={id}
                className="text-sm font-medium text-foreground cursor-pointer select-none"
              >
                {label}
                {showAsterisk && required && (
                  <span className="text-destructive ms-1" aria-hidden="true">
                    *
                  </span>
                )}
              </label>
            ) : <div />}
            {labelRight}
          </div>
        )}

        <div className="relative">
          <Input
            ref={ref}
            id={id}
            type={inputType}
            required={required}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(isPassword && "pe-9", className)}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          )}
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
