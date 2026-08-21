import {
  CalendarDays,
  CircleUserRound,
  Crown,
  Mail,
  ShieldCheck,
  ShieldX,
  UserRound,
} from "lucide-react";

import type {
  CurrentUser,
  FamilyRole,
  UserStatus,
} from "@/types/settings";

interface ProfileSettingsProps {
  user: CurrentUser | null;
  loading?: boolean;
}

const dateFormatter = new Intl.DateTimeFormat(
  "pt-BR",
  {
    dateStyle: "long",
  },
);

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return dateFormatter.format(date);
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

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

function statusLabel(
  status: UserStatus,
): string {
  switch (status) {
    case "ACTIVE":
      return "Conta ativa";

    case "BLOCKED":
      return "Conta bloqueada";

    case "DISABLED":
      return "Conta desativada";

    default:
      return status;
  }
}

function ProfileLoading() {
  return (
    <div
      className={[
        "rounded-3xl border",
        "border-white/10",
        "bg-white/[0.025] p-5",
        "sm:p-6",
      ].join(" ")}
    >
      <div className="flex items-center gap-4">
        <div className="size-16 animate-pulse rounded-2xl bg-white/[0.07]" />

        <div className="flex-1">
          <div className="h-5 w-48 animate-pulse rounded bg-white/[0.07]" />
          <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded bg-white/[0.04]" />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map(
          (_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl bg-white/[0.035]"
            />
          ),
        )}
      </div>
    </div>
  );
}

interface InformationCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}

function InformationCard({
  icon,
  label,
  value,
  detail,
}: InformationCardProps) {
  return (
    <div
      className={[
        "flex items-start gap-3",
        "rounded-2xl border",
        "border-white/10",
        "bg-white/[0.025] p-4",
      ].join(" ")}
    >
      <div
        className={[
          "flex size-10 shrink-0",
          "items-center justify-center",
          "rounded-xl border",
          "border-white/10",
          "bg-white/[0.04]",
          "text-zinc-400",
        ].join(" ")}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p
          className={[
            "text-[0.65rem] font-semibold",
            "uppercase tracking-[0.15em]",
            "text-zinc-600",
          ].join(" ")}
        >
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-zinc-200">
          {value}
        </p>

        {detail && (
          <p className="mt-1 text-xs leading-5 text-zinc-600">
            {detail}
          </p>
        )}
      </div>
    </div>
  );
}

export function ProfileSettings({
  user,
  loading = false,
}: ProfileSettingsProps) {
  if (loading) {
    return <ProfileLoading />;
  }

  if (!user) {
    return (
      <div
        className={[
          "rounded-3xl border",
          "border-white/10",
          "bg-white/[0.025] p-6",
          "text-center",
        ].join(" ")}
      >
        <CircleUserRound
          aria-hidden="true"
          className="mx-auto size-8 text-zinc-600"
        />

        <h2 className="mt-4 font-semibold text-white">
          Perfil indisponível
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          Não foi possível carregar os dados da sua conta.
        </p>
      </div>
    );
  }

  const active = user.status === "ACTIVE";

  return (
    <section
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
          "sm:flex-row sm:items-center",
        ].join(" ")}
      >
        <div
          className={[
            "flex size-16 shrink-0",
            "items-center justify-center",
            "rounded-2xl border",
            "border-white/15",
            "bg-white text-xl",
            "font-bold text-black",
          ].join(" ")}
        >
          {initials(user.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-semibold text-white">
              {user.name}
            </h2>

            <span
              className={[
                "inline-flex items-center gap-1.5",
                "rounded-full border px-2.5 py-1",
                "text-[0.65rem] font-semibold",
                "uppercase tracking-[0.12em]",
                active
                  ? [
                      "border-emerald-400/20",
                      "bg-emerald-400/[0.08]",
                      "text-emerald-300",
                    ].join(" ")
                  : [
                      "border-red-400/20",
                      "bg-red-400/[0.08]",
                      "text-red-300",
                    ].join(" "),
              ].join(" ")}
            >
              {active ? (
                <ShieldCheck
                  aria-hidden="true"
                  className="size-3"
                />
              ) : (
                <ShieldX
                  aria-hidden="true"
                  className="size-3"
                />
              )}

              {statusLabel(user.status)}
            </span>
          </div>

          <p className="mt-1 truncate text-sm text-zinc-500">
            {user.email}
          </p>
        </div>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <InformationCard
          icon={
            <UserRound
              aria-hidden="true"
              className="size-5"
            />
          }
          label="Nome"
          value={user.name}
          detail="Nome utilizado dentro do Núcleo."
        />

        <InformationCard
          icon={
            <Mail
              aria-hidden="true"
              className="size-5"
            />
          }
          label="E-mail"
          value={user.email}
          detail={
            user.emailVerified
              ? "Endereço verificado."
              : "Verificação de e-mail pendente."
          }
        />

        <InformationCard
          icon={
            <Crown
              aria-hidden="true"
              className="size-5"
            />
          }
          label="Papel no núcleo"
          value={roleLabel(user.family.role)}
          detail={user.family.name}
        />

        <InformationCard
          icon={
            <CalendarDays
              aria-hidden="true"
              className="size-5"
            />
          }
          label="Membro desde"
          value={formatDate(
            user.family.joinedAt,
          )}
          detail="Data de entrada neste núcleo familiar."
        />
      </div>

      <div
        className={[
          "mt-5 rounded-2xl border",
          "border-white/[0.07]",
          "bg-black/20 px-4 py-3",
          "text-xs leading-5",
          "text-zinc-600",
        ].join(" ")}
      >
        Neste momento, os dados do perfil são apenas
        informativos. A alteração de nome, e-mail e senha será
        disponibilizada quando esses endpoints forem adicionados
        à API.
      </div>
    </section>
  );
}