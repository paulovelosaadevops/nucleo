"use client";

import {
  Bell,
  BellRing,
} from "lucide-react";

interface NotificationFiltersProps {
  unreadOnly: boolean;
  disabled?: boolean;
  onUnreadOnlyChange: (
    unreadOnly: boolean,
  ) => void;
}

interface FilterButtonProps {
  active: boolean;
  disabled: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function FilterButton({
  active,
  disabled,
  label,
  icon,
  onClick,
}: FilterButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex min-h-10 items-center gap-2",
        "rounded-full border px-4 py-2",
        "text-sm font-medium transition",
        "disabled:cursor-not-allowed",
        "disabled:opacity-50",
        active
          ? "border-white bg-white text-black"
          : [
              "border-white/10",
              "bg-white/[0.035]",
              "text-zinc-400",
              "hover:border-white/20",
              "hover:bg-white/[0.07]",
              "hover:text-white",
            ].join(" "),
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

export function NotificationFilters({
  unreadOnly,
  disabled = false,
  onUnreadOnlyChange,
}: NotificationFiltersProps) {
  return (
    <div
      className={[
        "flex flex-wrap items-center gap-2",
        "rounded-2xl border border-white/10",
        "bg-white/[0.025] p-2",
      ].join(" ")}
      aria-label="Filtros de notificações"
    >
      <FilterButton
        active={!unreadOnly}
        disabled={disabled}
        label="Todas"
        icon={
          <Bell
            aria-hidden="true"
            className="size-4"
          />
        }
        onClick={() =>
          onUnreadOnlyChange(false)
        }
      />

      <FilterButton
        active={unreadOnly}
        disabled={disabled}
        label="Não lidas"
        icon={
          <BellRing
            aria-hidden="true"
            className="size-4"
          />
        }
        onClick={() =>
          onUnreadOnlyChange(true)
        }
      />
    </div>
  );
}