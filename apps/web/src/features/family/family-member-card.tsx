import {
  Crown,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import type {
  FamilyMember,
  FamilyRole,
} from "@/types/family";

interface FamilyMemberCardProps {
  member: FamilyMember;
}

const roleDetails: Record<
  FamilyRole,
  {
    label: string;
    description: string;
    icon: typeof UserRound;
  }
> = {
  OWNER: {
    label: "Proprietário",
    description: "Responsável principal pelo núcleo",
    icon: Crown,
  },
  ADMIN: {
    label: "Administrador",
    description: "Pode gerenciar membros e convites",
    icon: ShieldCheck,
  },
  MEMBER: {
    label: "Membro",
    description: "Participa da rotina familiar",
    icon: UserRound,
  },
};

function formatJoinedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function FamilyMemberCard({
  member,
}: FamilyMemberCardProps) {
  const details = roleDetails[member.role];
  const Icon = details.icon;

  const initials = member.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <article
      className={[
        "rounded-[1.5rem] border p-5 transition",
        member.status === "ACTIVE"
          ? "border-white/10 bg-white/[0.035]"
          : "border-white/[0.06] bg-white/[0.015] opacity-60",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-sm font-semibold text-white">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-white">
              {member.name}
            </h3>

            {member.currentUser ? (
              <span className="rounded-lg border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-300">
                Você
              </span>
            ) : null}
          </div>

          <p className="mt-1 truncate text-sm text-zinc-500">
            {member.email}
          </p>
        </div>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-zinc-300">
          <Icon className="size-4" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4">
        <div>
          <p className="text-xs text-zinc-600">Papel</p>
          <p className="mt-1 text-sm font-medium text-zinc-300">
            {details.label}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-600">
            Membro desde
          </p>
          <p className="mt-1 text-sm text-zinc-300">
            {formatJoinedAt(member.joinedAt)}
          </p>
        </div>
      </div>

      {member.status === "INACTIVE" ? (
        <p className="mt-4 text-xs font-medium text-amber-300">
          Membro inativo
        </p>
      ) : null}
    </article>
  );
}