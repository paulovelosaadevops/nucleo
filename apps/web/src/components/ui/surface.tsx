import { cn } from "@/lib/cn";
import type {
  HTMLAttributes,
  ReactNode,
} from "react";

type SurfaceVariant =
  | "default"
  | "elevated"
  | "inset"
  | "interactive";

type SurfacePadding =
  | "none"
  | "small"
  | "medium"
  | "large";

interface SurfaceProps
  extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: SurfaceVariant;
  padding?: SurfacePadding;
}

const variantClasses: Record<
  SurfaceVariant,
  string
> = {
  default:
    "border-white/10 bg-white/[0.045]",
  elevated:
    "nucleo-glass",
  inset:
    "border-white/[0.065] bg-black/25 shadow-inner",
  interactive:
    "border-white/10 bg-white/[0.045] transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.075]",
};

const paddingClasses: Record<
  SurfacePadding,
  string
> = {
  none: "",
  small: "p-3",
  medium: "p-4 sm:p-5",
  large: "p-5 sm:p-7",
};

export function Surface({
  children,
  className,
  variant = "default",
  padding = "medium",
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-[1.35rem] border",
        variantClasses[variant],
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}