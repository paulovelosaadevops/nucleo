"use client";

import {
  LoaderCircle,
  RefreshCw,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { AuditHistory } from "@/features/audit/audit-history";
import {
  notificationPreferenceService,
} from "@/features/notifications/notification-service";
import { FamilySettings } from "@/features/settings/family-settings";
import { NotificationSettings } from "@/features/settings/notification-settings";
import { ProfileSettings } from "@/features/settings/profile-settings";
import { SettingsNavigation } from "@/features/settings/settings-navigation";
import { settingsService } from "@/features/settings/settings-service";

import type {
  NotificationPreference,
  UpdateNotificationPreferenceRequest,
} from "@/types/notification";
import type {
  CurrentUser,
  FamilySettings as FamilySettingsData,
  SettingsSection,
  UpdateFamilySettingsRequest,
} from "@/types/settings";

function getErrorMessage(
  exception: unknown,
  fallback: string,
): string {
  if (exception instanceof Error) {
    return exception.message;
  }

  return fallback;
}

export function SettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("profile");

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [
    familySettings,
    setFamilySettings,
  ] =
    useState<FamilySettingsData | null>(
      null,
    );

  const [
    notificationPreference,
    setNotificationPreference,
  ] =
    useState<NotificationPreference | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadSettings = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      }

      setError(null);

      const [
        userResult,
        familyResult,
        notificationResult,
      ] = await Promise.allSettled([
        settingsService.getCurrentUser(),
        settingsService.getFamilySettings(),
        notificationPreferenceService.get(),
      ]);

      const errors: string[] = [];

      if (userResult.status === "fulfilled") {
        setCurrentUser(userResult.value);
      } else {
        errors.push(
          getErrorMessage(
            userResult.reason,
            "Não foi possível carregar o perfil.",
          ),
        );
      }

      if (
        familyResult.status === "fulfilled"
      ) {
        setFamilySettings(
          familyResult.value,
        );
      } else {
        errors.push(
          getErrorMessage(
            familyResult.reason,
            "Não foi possível carregar o núcleo familiar.",
          ),
        );
      }

      if (
        notificationResult.status ===
        "fulfilled"
      ) {
        setNotificationPreference(
          notificationResult.value,
        );
      } else {
        errors.push(
          getErrorMessage(
            notificationResult.reason,
            "Não foi possível carregar as preferências.",
          ),
        );
      }

      if (errors.length > 0) {
        setError(
          Array.from(
            new Set(errors),
          ).join(" "),
        );
      }

      if (showLoading) {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadSettings(false);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleUpdateFamily(
    request: UpdateFamilySettingsRequest,
  ) {
    const updated =
      await settingsService.updateFamilySettings(
        request,
      );

    setFamilySettings(updated);

    setCurrentUser((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        family: {
          ...current.family,
          name: updated.name,
        },
      };
    });
  }

  async function handleUpdateNotifications(
    request: UpdateNotificationPreferenceRequest,
  ) {
    const updated =
      await notificationPreferenceService.update(
        request,
      );

    setNotificationPreference(updated);
  }

  function renderActiveSection() {
    switch (activeSection) {
      case "profile":
        return (
          <ProfileSettings
            user={currentUser}
            loading={loading}
          />
        );

      case "family":
        return (
          <FamilySettings
            settings={familySettings}
            loading={loading}
            onSave={handleUpdateFamily}
          />
        );

      case "notifications":
        return (
          <NotificationSettings
            preference={
              notificationPreference
            }
            loading={loading}
            onSave={
              handleUpdateNotifications
            }
          />
        );

      case "audit":
        return <AuditHistory />;

      default:
        return null;
    }
  }

  return (
    <main
      className={[
        "mx-auto w-full max-w-7xl",
        "px-4 py-6",
        "sm:px-6 lg:px-8",
      ].join(" ")}
    >
      <header
        className={[
          "flex flex-col gap-5",
          "sm:flex-row sm:items-end",
          "sm:justify-between",
        ].join(" ")}
      >
        <div>
          <div
            className={[
              "inline-flex items-center gap-2",
              "rounded-full border",
              "border-white/10",
              "bg-white/[0.035]",
              "px-3 py-1.5",
              "text-xs font-medium",
              "text-zinc-400",
            ].join(" ")}
          >
            <Settings2
              aria-hidden="true"
              className="size-3.5"
            />

            Controle do Núcleo
          </div>

          <h1
            className={[
              "mt-4 text-3xl font-semibold",
              "tracking-tight text-white",
              "sm:text-4xl",
            ].join(" ")}
          >
            Configurações
          </h1>

          <p
            className={[
              "mt-2 max-w-2xl",
              "text-sm leading-6",
              "text-zinc-500",
              "sm:text-base",
            ].join(" ")}
          >
            Gerencie sua conta, núcleo familiar,
            notificações e histórico de atividades.
          </p>
        </div>

        <button
          type="button"
          disabled={loading || refreshing}
          onClick={handleRefresh}
          className={[
            "inline-flex min-h-11",
            "w-fit items-center",
            "justify-center gap-2",
            "rounded-full border",
            "border-white/10",
            "bg-white/[0.035]",
            "px-4 py-2.5",
            "text-sm font-medium",
            "text-zinc-300 transition",
            "hover:border-white/20",
            "hover:bg-white/[0.07]",
            "hover:text-white",
            "disabled:cursor-not-allowed",
            "disabled:opacity-50",
          ].join(" ")}
        >
          {refreshing ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin"
            />
          ) : (
            <RefreshCw
              aria-hidden="true"
              className="size-4"
            />
          )}

          {refreshing
            ? "Atualizando..."
            : "Atualizar dados"}
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className={[
            "mt-6 rounded-2xl border",
            "border-amber-400/20",
            "bg-amber-400/[0.07]",
            "px-4 py-3",
            "text-sm leading-6",
            "text-amber-100/80",
          ].join(" ")}
        >
          {error}
        </div>
      )}

      <div
        className={[
          "mt-7 grid items-start gap-6",
          "lg:grid-cols-[250px_minmax(0,1fr)]",
        ].join(" ")}
      >
        <aside className="lg:sticky lg:top-6">
          <SettingsNavigation
            activeSection={activeSection}
            onSectionChange={
              setActiveSection
            }
          />

          <div
            className={[
              "mt-4 hidden rounded-2xl",
              "border border-white/[0.07]",
              "bg-white/[0.018] p-4",
              "lg:block",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <ShieldCheck
                aria-hidden="true"
                className={[
                  "mt-0.5 size-4 shrink-0",
                  "text-zinc-500",
                ].join(" ")}
              />

              <p className="text-xs leading-5 text-zinc-600">
                Alterações importantes ficam registradas
                no histórico do núcleo.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          {renderActiveSection()}
        </div>
      </div>
    </main>
  );
}