import {
  Crown,
  MailCheck,
  ShieldCheck,
  Users,
} from "lucide-react";

import type {
  FamilyInvitation,
  FamilyMember,
} from "@/types/family";

interface FamilyOverviewProps {
  members: FamilyMember[];
  invitations: FamilyInvitation[];
  onOpenMembers: () => void;
  onOpenInvitations: () => void;
}

export function FamilyOverview({
  members,
  invitations,
  onOpenMembers,
  onOpenInvitations,
}: FamilyOverviewProps) {
  const currentMember = members.find(
    (member) => member.currentUser,
  );

  const activeMembers = members.filter(
    (member) => member.status === "ACTIVE",
  );

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "PENDING",
  );

  const owner = members.find(
    (member) => member.role === "OWNER",
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-500">
                Membros ativos
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {activeMembers.length}
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Users className="size-5" />
            </div>
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-500">
                Convites pendentes
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {pendingInvitations.length}
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-white">
              <MailCheck className="size-5" />
            </div>
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-sm text-zinc-500">
                Proprietário
              </p>
              <p className="mt-3 truncate text-base font-semibold text-white">
                {owner?.name ?? "Não identificado"}
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Crown className="size-5" />
            </div>
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-500">
                Seu acesso
              </p>
              <p className="mt-3 text-base font-semibold text-white">
                {currentMember?.role === "OWNER"
                  ? "Proprietário"
                  : currentMember?.role === "ADMIN"
                    ? "Administrador"
                    : "Membro"}
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-white">
              <ShieldCheck className="size-5" />
            </div>
          </div>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <button
          type="button"
          onClick={onOpenMembers}
          className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 text-left transition hover:bg-white/[0.06]"
        >
          <Users className="size-5 text-zinc-300" />

          <h2 className="mt-5 font-semibold text-white">
            Pessoas da família
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Veja quem participa do núcleo e o nível de acesso
            de cada pessoa.
          </p>
        </button>

        <button
          type="button"
          onClick={onOpenInvitations}
          className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 text-left transition hover:bg-white/[0.06]"
        >
          <MailCheck className="size-5 text-zinc-300" />

          <h2 className="mt-5 font-semibold text-white">
            Convites
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Convide familiares e acompanhe as respostas aos
            convites enviados.
          </p>
        </button>
      </div>
    </div>
  );
}