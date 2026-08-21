"use client";

import {
  Clock3,
  Crown,
  House,
  LoaderCircle,
  LockKeyhole,
  Save,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  FamilyRole,
  FamilySettings as FamilySettingsData,
  UpdateFamilySettingsRequest,
} from "@/types/settings";

interface FamilySettingsProps {
  settings: FamilySettingsData | null;
  loading?: boolean;
  onSave: (
    request: UpdateFamilySettingsRequest,
  ) => Promise<void>;
}

const supportedTimeZones = [
  {
    value: "America/Sao_Paulo",
    label: "Brasília — São Paulo",
  },
  {
    value: "America/Manaus",
    label: "Amazonas — Manaus",
  },
  {
    value: "America/Cuiaba",
    label: "Mato Grosso — Cuiabá",
  },
  {
    value: "America/Rio_Branco",
    label: "Acre — Rio Branco",
  },
  {
    value: "America/Fortaleza",
    label: "Nordeste — Fortaleza",
  },
  {
    value: "America/Recife",
    label: "Nordeste — Recife",
  },
  {
    value: "America/Bahia",
    label: "Bahia — Salvador",
  },
  {
    value: "America/Belem",
    label: "Pará — Belém",
  },
  {
    value: "UTC",
    label: "UTC — Tempo Universal",
  },
];

function roleLabel(role: FamilyRole): string {
  switch (role) {
    case "OWNER":
      return "Proprietário";

    case "ADMIN":
      return "Administrador";

    case "MEMBER":
      return "Membro";

    default:
      return role;
  }
}

function FamilySettingsLoading() {
  return (
    <div
      className={[
        "rounded-3xl border",
        "border-white/10",
        "bg-white/[0.025] p-5",
        "sm:p-6",
      ].join(" ")}
    >
      <div className="h-6 w-52 animate-pulse rounded bg-white/[0.07]" />
      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-white/[0.04]" />

      <div className="mt-7 space-y-5">
        <div className="h-24 animate-pulse rounded-2xl bg-white/[0.035]" />
        <div className="h-24 animate-pulse rounded-2xl bg-white/[0.035]" />
      </div>
    </div>
  );
}

function getErrorMessage(
  exception: unknown,
): string {
  if (exception instanceof Error) {
    return exception.message;
  }

  return "Não foi possível salvar as configurações.";
}

export function FamilySettings({
  settings,
  loading = false,
  onSave,
}: FamilySettingsProps) {
  const [name, setName] = useState("");
  const [timeZone, setTimeZone] =
    useState("America/Sao_Paulo");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState(false);

  useEffect(() => {
    if (!settings) {
      return;
    }

    setName(settings.name);
    setTimeZone(settings.timeZone);
  }, [settings]);

  const timeZoneOptions = useMemo(() => {
    if (
      !settings?.timeZone ||
      supportedTimeZones.some(
        (option) =>
          option.value === settings.timeZone,
      )
    ) {
      return supportedTimeZones;
    }

    return [
      {
        value: settings.timeZone,
        label: settings.timeZone,
      },
      ...supportedTimeZones,
    ];
  }, [settings?.timeZone]);

  const normalizedName =
    name.trim().replace(/\s+/g, " ");

  const unchanged =
    settings !== null &&
    normalizedName === settings.name &&
    timeZone === settings.timeZone;

  const validName =
    normalizedName.length >= 2 &&
    normalizedName.length <= 120;

  const canSubmit =
    Boolean(settings?.canManage) &&
    validName &&
    Boolean(timeZone) &&
    !unchanged &&
    !saving;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await onSave({
        name: normalizedName,
        timeZone,
      });

      setName(normalizedName);
      setSuccess(true);
    } catch (exception) {
      setError(
        getErrorMessage(exception),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <FamilySettingsLoading />;
  }

  if (!settings) {
    return (
      <div
        className={[
          "rounded-3xl border",
          "border-white/10",
          "bg-white/[0.025] p-6",
          "text-center",
        ].join(" ")}
      >
        <House
          aria-hidden="true"
          className="mx-auto size-8 text-zinc-600"
        />

        <h2 className="mt-4 font-semibold text-white">
          Núcleo indisponível
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          Não foi possível carregar as configurações familiares.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        "rounded-3xl border",
        "border-white/10",
        "bg-white/[0.025] p-5",
        "sm:p-6",
      ].join(" ")}
    >
      <header
        className={[
          "flex flex-col gap-4",
          "sm:flex-row sm:items-start",
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
            <House
              aria-hidden="true"
              className="size-5"
            />
          </div>

          <div>
            <h2 className="font-semibold text-white">
              Núcleo familiar
            </h2>

            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Nome e localização de referência da sua família.
            </p>
          </div>
        </div>

        <span
          className={[
            "inline-flex w-fit items-center gap-1.5",
            "rounded-full border",
            "border-white/10",
            "bg-white/[0.035]",
            "px-3 py-1.5",
            "text-xs font-medium",
            "text-zinc-400",
          ].join(" ")}
        >
          <Crown
            aria-hidden="true"
            className="size-3.5"
          />

          {roleLabel(
            settings.currentUserRole,
          )}
        </span>
      </header>

      {!settings.canManage && (
        <div
          className={[
            "mt-5 flex items-start gap-3",
            "rounded-2xl border",
            "border-amber-400/15",
            "bg-amber-400/[0.055]",
            "px-4 py-3",
          ].join(" ")}
        >
          <LockKeyhole
            aria-hidden="true"
            className={[
              "mt-0.5 size-4 shrink-0",
              "text-amber-300",
            ].join(" ")}
          />

          <p className="text-sm leading-6 text-amber-100/70">
            Somente o proprietário ou um administrador pode
            alterar estas configurações.
          </p>
        </div>
      )}

      <fieldset
        disabled={
          !settings.canManage || saving
        }
        className={[
          "mt-7 space-y-5",
          !settings.canManage
            ? "opacity-55"
            : "",
        ].join(" ")}
      >
        <div>
          <label
            htmlFor="family-settings-name"
            className="text-sm font-medium text-zinc-300"
          >
            Nome do núcleo
          </label>

          <div className="relative mt-2">
            <House
              aria-hidden="true"
              className={[
                "pointer-events-none absolute",
                "left-4 top-1/2 size-4",
                "-translate-y-1/2",
                "text-zinc-600",
              ].join(" ")}
            />

            <input
              id="family-settings-name"
              type="text"
              value={name}
              minLength={2}
              maxLength={120}
              required
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
                setSuccess(false);
              }}
              className={[
                "min-h-12 w-full",
                "rounded-2xl border",
                "border-white/10",
                "bg-black/25",
                "py-3 pl-11 pr-4",
                "text-sm text-white",
                "outline-none transition",
                "placeholder:text-zinc-700",
                "focus:border-white/30",
                "focus:bg-white/[0.035]",
                "disabled:cursor-not-allowed",
              ].join(" ")}
              placeholder="Nome da sua família"
            />
          </div>

          <div className="mt-2 flex justify-between gap-3">
            <p className="text-xs text-zinc-600">
              Entre 2 e 120 caracteres.
            </p>

            <p
              className={[
                "text-xs",
                name.length > 120
                  ? "text-red-300"
                  : "text-zinc-700",
              ].join(" ")}
            >
              {name.length}/120
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="family-settings-time-zone"
            className="text-sm font-medium text-zinc-300"
          >
            Fuso horário
          </label>

          <div className="relative mt-2">
            <Clock3
              aria-hidden="true"
              className={[
                "pointer-events-none absolute",
                "left-4 top-1/2 size-4",
                "-translate-y-1/2",
                "text-zinc-600",
              ].join(" ")}
            />

            <select
              id="family-settings-time-zone"
              value={timeZone}
              required
              onChange={(event) => {
                setTimeZone(
                  event.target.value,
                );

                setError(null);
                setSuccess(false);
              }}
              className={[
                "min-h-12 w-full",
                "appearance-none",
                "rounded-2xl border",
                "border-white/10",
                "bg-black py-3",
                "pl-11 pr-10",
                "text-sm text-white",
                "outline-none transition",
                "focus:border-white/30",
                "disabled:cursor-not-allowed",
              ].join(" ")}
            >
              {timeZoneOptions.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </div>

          <p className="mt-2 text-xs leading-5 text-zinc-600">
            Usado nos horários da agenda, lembretes e vencimentos.
          </p>
        </div>
      </fieldset>

      {error && (
        <div
          role="alert"
          className={[
            "mt-5 rounded-2xl border",
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
            "mt-5 rounded-2xl border",
            "border-emerald-400/20",
            "bg-emerald-400/[0.07]",
            "px-4 py-3",
            "text-sm text-emerald-200",
          ].join(" ")}
        >
          Configurações atualizadas com sucesso.
        </div>
      )}

      {settings.canManage && (
        <button
          type="submit"
          disabled={!canSubmit}
          className={[
            "mt-6 inline-flex min-h-11",
            "w-full items-center",
            "justify-center gap-2",
            "rounded-2xl bg-white",
            "px-4 py-3",
            "text-sm font-semibold text-black",
            "transition hover:bg-zinc-200",
            "disabled:cursor-not-allowed",
            "disabled:opacity-40",
            "sm:w-auto sm:min-w-52",
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
            : "Salvar alterações"}
        </button>
      )}
    </form>
  );
}