import {
  Bell,
  BellCheck,
  Inbox,
} from "lucide-react";

interface NotificationSummaryProps {
  unreadCount: number;
  totalElements: number;
  loading?: boolean;
}

interface SummaryItemProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlighted?: boolean;
}

function SummaryItem({
  label,
  value,
  icon,
  highlighted = false,
}: SummaryItemProps) {
  return (
    <div
      className={[
        "relative overflow-hidden",
        "rounded-2xl border p-4",
        highlighted
          ? [
              "border-white/20",
              "bg-white/[0.08]",
            ].join(" ")
          : [
              "border-white/10",
              "bg-white/[0.025]",
            ].join(" "),
      ].join(" ")}
    >
      <div
        className={[
          "absolute -right-8 -top-8",
          "size-24 rounded-full",
          highlighted
            ? "bg-white/[0.08]"
            : "bg-white/[0.025]",
          "blur-2xl",
        ].join(" ")}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {value.toLocaleString("pt-BR")}
          </p>
        </div>

        <div
          className={[
            "flex size-10 shrink-0 items-center",
            "justify-center rounded-xl border",
            highlighted
              ? [
                  "border-white/20",
                  "bg-white text-black",
                ].join(" ")
              : [
                  "border-white/10",
                  "bg-white/[0.04]",
                  "text-zinc-400",
                ].join(" "),
          ].join(" ")}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function LoadingSummary() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {Array.from({ length: 3 }).map(
        (_, index) => (
          <div
            key={index}
            className={[
              "h-[102px] animate-pulse",
              "rounded-2xl border",
              "border-white/10",
              "bg-white/[0.035]",
            ].join(" ")}
          />
        ),
      )}
    </div>
  );
}

export function NotificationSummary({
  unreadCount,
  totalElements,
  loading = false,
}: NotificationSummaryProps) {
  if (loading) {
    return <LoadingSummary />;
  }

  const readCount = Math.max(
    totalElements - unreadCount,
    0,
  );

  return (
    <section
      className="grid gap-3 sm:grid-cols-3"
      aria-label="Resumo das notificações"
    >
      <SummaryItem
        label="Total"
        value={totalElements}
        icon={
          <Inbox
            aria-hidden="true"
            className="size-5"
          />
        }
      />

      <SummaryItem
        label="Não lidas"
        value={unreadCount}
        highlighted={unreadCount > 0}
        icon={
          <Bell
            aria-hidden="true"
            className="size-5"
          />
        }
      />

      <SummaryItem
        label="Lidas"
        value={readCount}
        icon={
          <BellCheck
            aria-hidden="true"
            className="size-5"
          />
        }
      />
    </section>
  );
}