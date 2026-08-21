import type { LucideIcon } from "lucide-react";

interface FinanceSummaryCardProps {
  label: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  emphasis?: "default" | "positive" | "negative" | "warning";
}

const emphasisStyles = {
  default: {
    icon: "bg-white/10 text-white",
    glow: "from-white/[0.08]",
  },
  positive: {
    icon: "bg-emerald-400/10 text-emerald-300",
    glow: "from-emerald-400/[0.08]",
  },
  negative: {
    icon: "bg-rose-400/10 text-rose-300",
    glow: "from-rose-400/[0.08]",
  },
  warning: {
    icon: "bg-amber-400/10 text-amber-300",
    glow: "from-amber-400/[0.08]",
  },
} as const;

export function FinanceSummaryCard({
  label,
  value,
  description,
  icon: Icon,
  emphasis = "default",
}: FinanceSummaryCardProps) {
  const styles = emphasisStyles[emphasis];

  return (
    <article className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          styles.glow,
          "via-transparent to-transparent opacity-70",
        ].join(" ")}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-400">
            {label}
          </p>

          <p className="mt-3 truncate text-2xl font-semibold tracking-tight text-white">
            {value}
          </p>

          {description ? (
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              {description}
            </p>
          ) : null}
        </div>

        <div
          className={[
            "flex size-11 shrink-0 items-center justify-center rounded-2xl",
            styles.icon,
          ].join(" ")}
        >
          <Icon
            aria-hidden="true"
            className="size-5"
          />
        </div>
      </div>
    </article>
  );
}