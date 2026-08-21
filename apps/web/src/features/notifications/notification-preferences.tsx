"use client";

import {
  Bell,
  CalendarDays,
  CircleDollarSign,
  LoaderCircle,
  Save,
  Settings2,
  ShoppingBasket,
  Users,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type {
  NotificationPreference,
  UpdateNotificationPreferenceRequest,
} from "@/types/notification";

interface NotificationPreferencesProps {
  preference: NotificationPreference | null;
  loading?: boolean;
  onSave: (
    request: UpdateNotificationPreferenceRequest,
  ) => Promise<void>;
}

type PreferenceKey =
  keyof UpdateNotificationPreferenceRequest;

interface PreferenceOption {
  key: PreferenceKey;
  title: string;
  description: string;
  icon: ReactNode;
}

const preferenceOptions: PreferenceOption[] = [
  {
    key: "familyEnabled",
    title: "Família",
    description:
      "Convites, entrada de membros e alterações de função.",
    icon: (
      <Users
        aria-hidden="true"
        className="size-5"
      />
    ),
  },
  {
    key: "agendaEnabled",
    title: "Agenda",
    description:
      "Novos compromissos, atualizações e lembretes.",
    icon: (
      <CalendarDays
        aria-hidden="true"
        className="size-5"
      />
    ),
  },
  {
    key: "shoppingEnabled",
    title: "Compras",
    description:
      "Alterações nas listas e novos itens compartilhados.",
    icon: (
      <ShoppingBasket
        aria-hidden="true"
        className="size-5"
      />
    ),
  },
  {
    key: "financeEnabled",
    title: "Finanças",
    description:
      "Alertas de orçamento, vencimentos e faturas.",
    icon: (
      <CircleDollarSign
        aria-hidden="true"
        className="size-5"
      />
    ),
  },
];

const defaultPreference: UpdateNotificationPreferenceRequest =
  {
    inAppEnabled: true,
    familyEnabled: true,
    agendaEnabled: true,
    shoppingEnabled: true,
    financeEnabled: true,
  };

function requestFromPreference(
  preference: NotificationPreference,
): UpdateNotificationPreferenceRequest {
  return {
    inAppEnabled: preference.inAppEnabled,
    familyEnabled: preference.familyEnabled,
    agendaEnabled: preference.agendaEnabled,
    shoppingEnabled: preference.shoppingEnabled,
    financeEnabled: preference.financeEnabled,
  };
}

interface PreferenceSwitchProps {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

function PreferenceSwitch({
  checked,
  disabled = false,
  label,
  onChange,
}: PreferenceSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-7 w-12 shrink-0",
        "rounded-full border transition",
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-white/60",
        "disabled:cursor-not-allowed",
        "disabled:opacity-40",
        checked
          ? "border-white bg-white"
          : [
              "border-white/15",
              "bg-white/[0.05]",
            ].join(" "),
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 size-5",
          "rounded-full transition",
          checked
            ? "left-6 bg-black"
            : "left-1 bg-zinc-500",
        ].join(" ")}
      />
    </button>
  );
}

function PreferencesLoading() {
  return (
    <div
      className={[
        "rounded-3xl border",
        "border-white/10",
        "bg-white/[0.025] p-5",
      ].join(" ")}
    >
      <div className="h-6 w-44 animate-pulse rounded-lg bg-white/[0.07]" />

      <div className="mt-5 space-y-3">
        {Array.from({ length: 5 }).map(
          (_, index) => (
            <div
              key={index}
              className={[
                "h-20 animate-pulse",
                "rounded-2xl bg-white/[0.035]",
              ].join(" ")}
            />
          ),
        )}
      </div>
    </div>
  );
}

export function NotificationPreferences({
  preference,
  loading = false,
  onSave,
}: NotificationPreferencesProps) {
  const [draft, setDraft] =
    useState<UpdateNotificationPreferenceRequest>(
      defaultPreference,
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState(false);

  useEffect(() => {
    if (!preference) {
      return;
    }

    setDraft(
      requestFromPreference(preference),
    );
  }, [preference]);

  function changePreference(
    key: PreferenceKey,
    checked: boolean,
  ) {
    setSuccess(false);
    setError(null);

    setDraft((current) => ({
      ...current,
      [key]: checked,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await onSave(draft);
      setSuccess(true);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Não foi possível salvar as preferências.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PreferencesLoading />;
  }

  if (!preference) {
    return (
      <section
        className={[
          "rounded-3xl border",
          "border-white/10",
          "bg-white/[0.025] p-5",
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          <div
            className={[
              "flex size-10 items-center",
              "justify-center rounded-xl",
              "border border-white/10",
              "bg-white/[0.04]",
              "text-zinc-400",
            ].join(" ")}
          >
            <Settings2
              aria-hidden="true"
              className="size-5"
            />
          </div>

          <div>
            <h2 className="font-semibold text-white">
              Preferências
            </h2>

            <p className="text-sm text-zinc-500">
              Não foi possível carregar suas configurações.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        "rounded-3xl border",
        "border-white/10",
        "bg-white/[0.025] p-5",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "flex size-10 shrink-0",
            "items-center justify-center",
            "rounded-xl border",
            "border-white/10",
            "bg-white/[0.04]",
            "text-zinc-300",
          ].join(" ")}
        >
          <Settings2
            aria-hidden="true"
            className="size-5"
          />
        </div>

        <div>
          <h2 className="font-semibold text-white">
            Preferências
          </h2>

          <p className="mt-1 text-sm leading-5 text-zinc-500">
            Escolha quais atualizações deseja receber dentro
            do Núcleo.
          </p>
        </div>
      </div>

      <div
        className={[
          "mt-5 rounded-2xl border p-4",
          draft.inAppEnabled
            ? [
                "border-white/15",
                "bg-white/[0.055]",
              ].join(" ")
            : [
                "border-white/[0.07]",
                "bg-white/[0.018]",
              ].join(" "),
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          <div
            className={[
              "flex size-10 shrink-0",
              "items-center justify-center",
              "rounded-xl border",
              "border-white/10",
              "bg-white/[0.04]",
              draft.inAppEnabled
                ? "text-white"
                : "text-zinc-600",
            ].join(" ")}
          >
            <Bell
              aria-hidden="true"
              className="size-5"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-white">
              Notificações no aplicativo
            </h3>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Ativa ou desativa todas as notificações internas.
            </p>
          </div>

          <PreferenceSwitch
            checked={draft.inAppEnabled}
            disabled={saving}
            label="Notificações no aplicativo"
            onChange={(checked) =>
              changePreference(
                "inAppEnabled",
                checked,
              )
            }
          />
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {preferenceOptions.map((option) => {
          const checked = draft[option.key];

          return (
            <div
              key={option.key}
              className={[
                "flex items-center gap-3",
                "rounded-2xl border p-4",
                "transition",
                checked &&
                draft.inAppEnabled
                  ? [
                      "border-white/10",
                      "bg-white/[0.035]",
                    ].join(" ")
                  : [
                      "border-white/[0.06]",
                      "bg-transparent",
                    ].join(" "),
              ].join(" ")}
            >
              <div
                className={[
                  "flex size-10 shrink-0",
                  "items-center justify-center",
                  "rounded-xl border",
                  "border-white/10",
                  "bg-white/[0.035]",
                  checked &&
                  draft.inAppEnabled
                    ? "text-zinc-300"
                    : "text-zinc-700",
                ].join(" ")}
              >
                {option.icon}
              </div>

              <div className="min-w-0 flex-1">
                <h3
                  className={[
                    "text-sm font-medium",
                    draft.inAppEnabled
                      ? "text-zinc-200"
                      : "text-zinc-600",
                  ].join(" ")}
                >
                  {option.title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-zinc-600">
                  {option.description}
                </p>
              </div>

              <PreferenceSwitch
                checked={checked}
                disabled={
                  saving ||
                  !draft.inAppEnabled
                }
                label={`Notificações de ${option.title}`}
                onChange={(newValue) =>
                  changePreference(
                    option.key,
                    newValue,
                  )
                }
              />
            </div>
          );
        })}
      </div>

      {error && (
        <div
          role="alert"
          className={[
            "mt-4 rounded-2xl border",
            "border-red-400/20",
            "bg-red-400/[0.07]",
            "px-4 py-3",
            "text-sm text-red-200",
          ].join(" ")}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className={[
            "mt-4 rounded-2xl border",
            "border-emerald-400/20",
            "bg-emerald-400/[0.07]",
            "px-4 py-3",
            "text-sm text-emerald-200",
          ].join(" ")}
        >
          Preferências salvas com sucesso.
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className={[
          "mt-5 inline-flex min-h-11",
          "w-full items-center",
          "justify-center gap-2",
          "rounded-2xl bg-white",
          "px-4 py-3",
          "text-sm font-semibold text-black",
          "transition hover:bg-zinc-200",
          "disabled:cursor-not-allowed",
          "disabled:opacity-60",
        ].join(" ")}
      >
        {saving ? (
          <LoaderCircle
            aria-hidden="true"
            className="size-4 animate-spin"
          />
        ) : (
          <Save
            aria-hidden="true"
            className="size-4"
          />
        )}

        {saving
          ? "Salvando..."
          : "Salvar preferências"}
      </button>
    </form>
  );
}