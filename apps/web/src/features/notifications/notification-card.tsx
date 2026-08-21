"use client";

import {
  Bell,
  CalendarDays,
  Check,
  CircleDollarSign,
  ExternalLink,
  Info,
  LoaderCircle,
  Mail,
  MailOpen,
  ShoppingBasket,
  Trash2,
  Users,
} from "lucide-react";

import type {
  NotificationItem,
  NotificationType,
} from "@/types/notification";

interface NotificationCardProps {
  notification: NotificationItem;
  busy?: boolean;
  onOpen: (
    notification: NotificationItem,
  ) => void;
  onToggleRead: (
    notification: NotificationItem,
  ) => void;
  onDelete: (
    notification: NotificationItem,
  ) => void;
}

interface NotificationAppearance {
  label: string;
  icon: React.ReactNode;
  iconClassName: string;
}

const dateFormatter = new Intl.DateTimeFormat(
  "pt-BR",
  {
    dateStyle: "medium",
    timeStyle: "short",
  },
);

function formatNotificationDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return dateFormatter.format(date);
}

function notificationAppearance(
  type: NotificationType,
): NotificationAppearance {
  switch (type) {
    case "FAMILY_INVITATION":
      return {
        label: "Convite",
        icon: (
          <Mail
            aria-hidden="true"
            className="size-5"
          />
        ),
        iconClassName:
          "border-sky-400/20 bg-sky-400/10 text-sky-300",
      };

    case "FAMILY_MEMBER_JOINED":
    case "FAMILY_ROLE_CHANGED":
      return {
        label: "Família",
        icon: (
          <Users
            aria-hidden="true"
            className="size-5"
          />
        ),
        iconClassName:
          "border-violet-400/20 bg-violet-400/10 text-violet-300",
      };

    case "AGENDA_EVENT_CREATED":
    case "AGENDA_EVENT_UPDATED":
    case "AGENDA_REMINDER":
      return {
        label: "Agenda",
        icon: (
          <CalendarDays
            aria-hidden="true"
            className="size-5"
          />
        ),
        iconClassName:
          "border-blue-400/20 bg-blue-400/10 text-blue-300",
      };

    case "SHOPPING_LIST_UPDATED":
    case "SHOPPING_ITEM_ADDED":
      return {
        label: "Compras",
        icon: (
          <ShoppingBasket
            aria-hidden="true"
            className="size-5"
          />
        ),
        iconClassName:
          "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      };

    case "FINANCIAL_BUDGET_ALERT":
    case "FINANCIAL_TRANSACTION_DUE":
    case "CREDIT_CARD_INVOICE_DUE":
      return {
        label: "Finanças",
        icon: (
          <CircleDollarSign
            aria-hidden="true"
            className="size-5"
          />
        ),
        iconClassName:
          "border-amber-400/20 bg-amber-400/10 text-amber-300",
      };

    case "SYSTEM":
      return {
        label: "Sistema",
        icon: (
          <Info
            aria-hidden="true"
            className="size-5"
          />
        ),
        iconClassName:
          "border-white/15 bg-white/[0.06] text-zinc-300",
      };

    default:
      return {
        label: "Notificação",
        icon: (
          <Bell
            aria-hidden="true"
            className="size-5"
          />
        ),
        iconClassName:
          "border-white/15 bg-white/[0.06] text-zinc-300",
      };
  }
}

export function NotificationCard({
  notification,
  busy = false,
  onOpen,
  onToggleRead,
  onDelete,
}: NotificationCardProps) {
  const appearance =
    notificationAppearance(notification.type);

  return (
    <article
      className={[
        "group relative overflow-hidden",
        "rounded-3xl border p-4",
        "transition duration-200",
        notification.read
          ? [
              "border-white/[0.07]",
              "bg-white/[0.018]",
            ].join(" ")
          : [
              "border-white/15",
              "bg-white/[0.055]",
              "shadow-[0_18px_60px_rgba(0,0,0,0.25)]",
            ].join(" "),
      ].join(" ")}
    >
      {!notification.read && (
        <div
          className={[
            "absolute left-0 top-6",
            "h-10 w-0.5 rounded-r-full",
            "bg-white",
          ].join(" ")}
        />
      )}

      <div className="flex items-start gap-3">
        <div
          className={[
            "flex size-11 shrink-0",
            "items-center justify-center",
            "rounded-2xl border",
            appearance.iconClassName,
          ].join(" ")}
        >
          {appearance.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={[
              "flex flex-col gap-2",
              "sm:flex-row sm:items-start",
              "sm:justify-between",
            ].join(" ")}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "rounded-full border",
                    "border-white/10",
                    "bg-white/[0.035]",
                    "px-2.5 py-1",
                    "text-[0.65rem] font-semibold",
                    "uppercase tracking-[0.14em]",
                    "text-zinc-400",
                  ].join(" ")}
                >
                  {appearance.label}
                </span>

                {!notification.read && (
                  <span
                    className={[
                      "rounded-full bg-white",
                      "px-2 py-1",
                      "text-[0.65rem] font-bold",
                      "uppercase tracking-[0.12em]",
                      "text-black",
                    ].join(" ")}
                  >
                    Nova
                  </span>
                )}
              </div>

              <h3
                className={[
                  "mt-3 text-base font-semibold",
                  "leading-6",
                  notification.read
                    ? "text-zinc-300"
                    : "text-white",
                ].join(" ")}
              >
                {notification.title}
              </h3>

              <p
                className={[
                  "mt-1.5 text-sm leading-6",
                  notification.read
                    ? "text-zinc-500"
                    : "text-zinc-400",
                ].join(" ")}
              >
                {notification.message}
              </p>

              <p className="mt-3 text-xs text-zinc-600">
                {formatNotificationDate(
                  notification.createdAt,
                )}
              </p>
            </div>
          </div>

          <div
            className={[
              "mt-4 flex flex-wrap",
              "items-center gap-2",
            ].join(" ")}
          >
            {notification.actionPath && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onOpen(notification)
                }
                className={[
                  "inline-flex min-h-9",
                  "items-center gap-2",
                  "rounded-full border",
                  "border-white/15",
                  "bg-white text-black",
                  "px-3.5 py-2",
                  "text-xs font-semibold",
                  "transition",
                  "hover:bg-zinc-200",
                  "disabled:cursor-not-allowed",
                  "disabled:opacity-50",
                ].join(" ")}
              >
                {busy ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-3.5 animate-spin"
                  />
                ) : (
                  <ExternalLink
                    aria-hidden="true"
                    className="size-3.5"
                  />
                )}

                Abrir
              </button>
            )}

            <button
              type="button"
              disabled={busy}
              onClick={() =>
                onToggleRead(notification)
              }
              className={[
                "inline-flex min-h-9",
                "items-center gap-2",
                "rounded-full border",
                "border-white/10",
                "bg-white/[0.035]",
                "px-3.5 py-2",
                "text-xs font-medium",
                "text-zinc-400 transition",
                "hover:border-white/20",
                "hover:bg-white/[0.07]",
                "hover:text-white",
                "disabled:cursor-not-allowed",
                "disabled:opacity-50",
              ].join(" ")}
            >
              {busy ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-3.5 animate-spin"
                />
              ) : notification.read ? (
                <MailOpen
                  aria-hidden="true"
                  className="size-3.5"
                />
              ) : (
                <Check
                  aria-hidden="true"
                  className="size-3.5"
                />
              )}

              {notification.read
                ? "Marcar como não lida"
                : "Marcar como lida"}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() =>
                onDelete(notification)
              }
              className={[
                "inline-flex min-h-9",
                "items-center gap-2",
                "rounded-full border",
                "border-red-400/10",
                "bg-red-400/[0.035]",
                "px-3.5 py-2",
                "text-xs font-medium",
                "text-red-300/70 transition",
                "hover:border-red-400/25",
                "hover:bg-red-400/10",
                "hover:text-red-200",
                "disabled:cursor-not-allowed",
                "disabled:opacity-50",
              ].join(" ")}
            >
              <Trash2
                aria-hidden="true"
                className="size-3.5"
              />

              Excluir
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}