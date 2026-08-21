"use client";

import { cn } from "@/lib/cn";
import { LoaderCircle } from "lucide-react";
import {
  forwardRef,
  type ButtonHTMLAttributes,
} from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger";

type ButtonSize =
  | "small"
  | "medium"
  | "large"
  | "icon";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<
  ButtonVariant,
  string
> = {
  primary:
    "border-white bg-white text-black hover:bg-zinc-200 active:bg-zinc-300",
  secondary:
    "border-white/12 bg-white/[0.07] text-white hover:border-white/20 hover:bg-white/[0.11]",
  ghost:
    "border-transparent bg-transparent text-zinc-300 hover:bg-white/[0.07] hover:text-white",
  danger:
    "border-red-400/20 bg-red-400/10 text-red-300 hover:bg-red-400/15",
};

const sizeClasses: Record<ButtonSize, string> = {
  small: "h-9 rounded-xl px-3.5 text-sm",
  medium: "h-11 rounded-[0.9rem] px-4 text-sm",
  large: "h-13 rounded-2xl px-5 text-[0.95rem]",
  icon: "h-11 w-11 rounded-[0.9rem] p-0",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(function Button(
  {
    className,
    variant = "primary",
    size = "medium",
    loading = false,
    disabled,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 border font-medium outline-none transition duration-200",
        "focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        "disabled:pointer-events-none disabled:opacity-45",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <LoaderCircle
          aria-hidden="true"
          className="h-4 w-4 animate-spin"
        />
      )}

      {children}
    </button>
  );
});