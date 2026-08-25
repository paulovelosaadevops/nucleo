import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface FinanceCompactListProps {
  columns: string[];
  gridClassName: string;
  children: ReactNode;
}

export function FinanceCompactList({
  columns,
  gridClassName,
  children,
}: FinanceCompactListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
      <div
        className={cn(
          "hidden border-b border-white/[0.07] bg-white/[0.035] px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-wider text-zinc-500 lg:grid",
          gridClassName,
        )}
      >
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>

      <div className="divide-y divide-white/[0.07]">{children}</div>
    </div>
  );
}

interface FinanceCompactRowProps {
  gridClassName: string;
  className?: string;
  children: ReactNode;
}

export function FinanceCompactRow({
  gridClassName,
  className,
  children,
}: FinanceCompactRowProps) {
  return (
    <div
      className={cn(
        "px-4 py-3 transition hover:bg-white/[0.035] lg:grid lg:min-h-14 lg:items-center lg:gap-4",
        gridClassName,
        className,
      )}
    >
      {children}
    </div>
  );
}

interface FinanceCellProps {
  label?: string;
  className?: string;
  children: ReactNode;
}

export function FinanceCell({
  label,
  className,
  children,
}: FinanceCellProps) {
  return (
    <div className={cn("min-w-0", className)}>
      {label ? (
        <p className="mb-1 text-[0.68rem] font-medium uppercase tracking-wider text-zinc-600 lg:hidden">
          {label}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export function FinanceStatusPill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "positive" | "warning" | "danger";
}) {
  const tones = {
    muted: "border-white/10 bg-white/[0.04] text-zinc-400",
    positive: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    danger: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  };

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-lg border px-2 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
