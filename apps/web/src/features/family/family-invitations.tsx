"use client";

import { useState } from "react";
import {
  Ban,
  Check,
  Clock,
  Copy,
  LoaderCircle,
  MailPlus,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import { FamilyInvitationForm } from "./family-invitation-form";

import { confirmDialog } from "@/lib/feedback";

import type {
  CreateFamilyInvitationRequest,
  FamilyInvitation,
  FamilyInvitationCreated,
  FamilyRole,
  InvitationStatus,
} from "@/types/family";

interface FamilyInvitationsProps {
  invitations: FamilyInvitation[];
  currentRole: FamilyRole;
  submitting: boolean;
  actionId: string | null;
  onCreate: (
    request: CreateFamilyInvitationRequest,
  ) => Promise<FamilyInvitationCreated>;
  onRevoke: (invitationId: string) => Promise<void>;
}

const statusDetails: Record<
  InvitationStatus,
  {
    label: string;
    icon: typeof Clock;
    className: string;
  }
> = {
  PENDING: {
    label: "Pendente",
    icon: Clock,
    className: "text-amber-300 bg-amber-400/10",
  },
  ACCEPTED: {
    label: "Aceito",
    icon: Check,
    className: "text-emerald-300 bg-emerald-400/10",
  },
  DECLINED: {
    label: "Recusado",
    icon: X,
    className: "text-zinc-400 bg-white/[0.06]",
  },
  REVOKED: {
    label: "Revogado",
    icon: Ban,
    className: "text-zinc-500 bg-white/[0.04]",
  },
  EXPIRED: {
    label: "Expirado",
    icon: Clock,
    className: "text-zinc-500 bg-white/[0.04]",
  },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function FamilyInvitations({
  invitations,
  currentRole,
  submitting,
  actionId,
  onCreate,
  onRevoke,
}: FamilyInvitationsProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(
    null,
  );

  const canManage =
    currentRole === "OWNER" || currentRole === "ADMIN";

  async function copyEmail(email: string) {
    await navigator.clipboard.writeText(email);
    setCopiedEmail(email);

    window.setTimeout(() => setCopiedEmail(null), 1800);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold text-white">
            Convites do núcleo
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            {invitations.length} enviados
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-black"
          >
            <MailPlus className="size-4" />
            Novo convite
          </button>
        ) : null}
      </div>

      {!canManage ? (
        <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">
          <ShieldCheck className="size-4 shrink-0" />
          Apenas proprietários e administradores podem criar ou
          revogar convites.
        </div>
      ) : null}

      {invitations.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
          <MailPlus className="size-8 text-zinc-600" />

          <p className="mt-4 font-medium text-zinc-300">
            Nenhum convite enviado
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((invitation) => {
            const status = statusDetails[invitation.status];
            const StatusIcon = status.icon;
            const processing = actionId === invitation.id;

            return (
              <article
                key={invitation.id}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-zinc-300">
                      {invitation.role === "ADMIN" ? (
                        <ShieldCheck className="size-5" />
                      ) : (
                        <UserRound className="size-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">
                        {invitation.email}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {invitation.role === "ADMIN"
                          ? "Administrador"
                          : "Membro"}
                        {" • "}
                        Enviado por {invitation.invitedBy.name}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        Expira em {formatDate(invitation.expiresAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span
                      className={[
                        "inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-medium",
                        status.className,
                      ].join(" ")}
                    >
                      <StatusIcon className="size-3.5" />
                      {status.label}
                    </span>

                    <button
                      type="button"
                      title="Copiar e-mail"
                      onClick={() =>
                        void copyEmail(invitation.email)
                      }
                      className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"
                    >
                      {copiedEmail === invitation.email ? (
                        <Check className="size-4" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>

                    {canManage &&
                    invitation.status === "PENDING" ? (
                      processing ? (
                        <div className="flex size-9 items-center justify-center">
                          <LoaderCircle className="size-4 animate-spin text-zinc-500" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          title="Revogar convite"
                          onClick={() => {
                            void confirmDialog({
                              title: "Revogar convite",
                              description: `Deseja revogar o convite enviado para ${invitation.email}?`,
                              confirmLabel: "Revogar",
                              variant: "danger",
                            }).then((confirmed) => {
                              if (confirmed) {
                                void onRevoke(invitation.id);
                              }
                            });
                          }}
                          className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-rose-400/10 hover:text-rose-300"
                        >
                          <Ban className="size-4" />
                        </button>
                      )
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {formOpen ? (
        <FamilyInvitationForm
          submitting={submitting}
          onSubmit={onCreate}
          onCancel={() => {
            if (!submitting) {
              setFormOpen(false);
            }
          }}
        />
      ) : null}
    </section>
  );
}
