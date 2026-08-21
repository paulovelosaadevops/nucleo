"use client";

import {
  BellRing,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

import { NotificationPreferences } from "@/features/notifications/notification-preferences";

import type {
  NotificationPreference,
  UpdateNotificationPreferenceRequest,
} from "@/types/notification";

interface NotificationSettingsProps {
  preference: NotificationPreference | null;
  loading?: boolean;
  onSave: (
    request: UpdateNotificationPreferenceRequest,
  ) => Promise<void>;
}

export function NotificationSettings({
  preference,
  loading = false,
  onSave,
}: NotificationSettingsProps) {
  return (
    <section className="space-y-4">
      <div
        className={[
          "relative overflow-hidden",
          "rounded-3xl border",
          "border-white/10",
          "bg-white/[0.025] p-5",
          "sm:p-6",
        ].join(" ")}
      >
        <div
          className={[
            "pointer-events-none absolute",
            "-right-12 -top-12",
            "size-40 rounded-full",
            "bg-white/[0.04] blur-3xl",
          ].join(" ")}
        />

        <div
          className={[
            "relative flex flex-col gap-4",
            "sm:flex-row sm:items-center",
            "sm:justify-between",
          ].join(" ")}
        >
          <div className="flex items-start gap-3">
            <div
              className={[
                "flex size-11 shrink-0",
                "items-center justify-center",
                "rounded-2xl border",
                "border-white/10",
                "bg-white/[0.04]",
                "text-zinc-300",
              ].join(" ")}
            >
              <BellRing
                aria-hidden="true"
                className="size-5"
              />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                Central de alertas
              </h2>

              <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-500">
                Defina quais áreas podem gerar notificações
                dentro do aplicativo.
              </p>
            </div>
          </div>

          <Link
            href="/notificacoes"
            className={[
              "inline-flex min-h-10",
              "w-fit items-center gap-2",
              "rounded-full border",
              "border-white/10",
              "bg-white/[0.035]",
              "px-4 py-2",
              "text-sm font-medium",
              "text-zinc-300 transition",
              "hover:border-white/20",
              "hover:bg-white/[0.07]",
              "hover:text-white",
            ].join(" ")}
          >
            Ver notificações

            <ExternalLink
              aria-hidden="true"
              className="size-4"
            />
          </Link>
        </div>
      </div>

      <NotificationPreferences
        preference={preference}
        loading={loading}
        onSave={onSave}
      />
    </section>
  );
}