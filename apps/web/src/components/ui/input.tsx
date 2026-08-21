"use client";

import { cn } from "@/lib/cn";
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: ReactNode;
  trailingElement?: ReactNode;
}

export const Input = forwardRef<
  HTMLInputElement,
  InputProps
>(function Input(
  {
    id,
    label,
    error,
    hint,
    leadingIcon,
    trailingElement,
    className,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId =
    error || hint
      ? `${inputId}-description`
      : undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leadingIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
            {leadingIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionId}
          className={cn(
            "h-12 w-full rounded-2xl border bg-white/[0.045] px-4 text-[0.95rem] text-white outline-none transition",
            "border-white/10 placeholder:text-zinc-600",
            "hover:border-white/16",
            "focus:border-white/30 focus:bg-white/[0.065] focus:ring-2 focus:ring-white/[0.06]",
            leadingIcon && "pl-11",
            trailingElement && "pr-12",
            error &&
              "border-red-400/40 focus:border-red-400/60 focus:ring-red-400/10",
            className,
          )}
          {...props}
        />

        {trailingElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {trailingElement}
          </div>
        )}
      </div>

      {(error || hint) && (
        <p
          id={descriptionId}
          className={cn(
            "mt-2 text-xs leading-relaxed",
            error
              ? "text-red-300"
              : "text-zinc-500",
          )}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
});