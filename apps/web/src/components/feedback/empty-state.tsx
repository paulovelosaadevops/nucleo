import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
}: EmptyStateProps) {
  return (
    <Surface
      variant="inset"
      padding="large"
      className="flex min-h-64 flex-col items-center justify-center text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-zinc-300">
        <Icon
          aria-hidden="true"
          className="h-6 w-6"
        />
      </div>

      <h2 className="mt-5 text-lg font-semibold text-white">
        {title}
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          className="mt-6"
          variant="secondary"
          onClick={onAction}
        >
          {actionIcon}
          {actionLabel}
        </Button>
      )}
    </Surface>
  );
}