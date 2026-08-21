"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Clock,
  LoaderCircle,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import { familyService } from "./family-service";

import type { FamilyInvitationPreview } from "@/types/family";

interface InvitationPreviewProps {
  token: string;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function InvitationPreview({
  token,
}: InvitationPreviewProps) {
  const [invitation, setInvitation] =
    useState<FamilyInvitationPreview | null>(null);

  const [loading, setLoading] = useState(true);
  const [declining, setDeclining] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInvitation() {
      setLoading(true);
      setError(null);

      try {
        const response =
          await familyService.invitations.preview(token);

        if (active) {
          setInvitation(response);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Não foi possível carregar o convite.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInvitation();

    return () => {
      active = false;
    };
  }, [token]);

  async function declineInvitation() {
    const confirmed = window.confirm(
      "Deseja realmente recusar este convite?",
    );

    if (!confirmed) {
      return;
    }

    setDeclining(true);
    setError(null);

    try {
      await familyService.invitations.decline(token);
      setDeclined(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível recusar o convite.",
      );
    } finally {
      setDeclining(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black">
        <LoaderCircle className="size-7 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-black p-5">
        <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 text-center">
          <AlertCircle className="mx-auto size-9 text-rose-300" />

          <h1 className="mt-5 text-xl font-semibold text-white">
            Convite indisponível
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            {error ??
              "Este convite não pôde ser encontrado."}
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-black"
          >
            Ir para o login
          </Link>
        </section>
      </main>
    );
  }

  const invalid =
    declined || invitation.status !== "PENDING";

  const roleLabel =
    invitation.role === "ADMIN"
      ? "Administrador"
      : "Membro";

  const RoleIcon =
    invitation.role === "ADMIN"
      ? ShieldCheck
      : UserRound;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-black p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />

      <section className="relative w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-white">
          {invalid ? (
            <X className="size-5" />
          ) : (
            <Check className="size-5" />
          )}
        </div>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-zinc-600">
          Convite para o Núcleo
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          {invalid
            ? "Este convite não está mais disponível"
            : `Você foi convidado para ${invitation.familyName}`}
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          {invalid
            ? "O convite pode ter sido aceito, recusado, revogado ou expirado."
            : `${invitation.invitedByName} convidou ${invitation.maskedEmail} para participar da central familiar.`}
        </p>

        {!invalid ? (
          <div className="mt-6 space-y-3 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-3">
              <RoleIcon className="size-4 text-zinc-400" />

              <div>
                <p className="text-xs text-zinc-600">
                  Papel no núcleo
                </p>
                <p className="mt-0.5 text-sm text-zinc-300">
                  {roleLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="size-4 text-zinc-400" />

              <div>
                <p className="text-xs text-zinc-600">
                  Válido até
                </p>
                <p className="mt-0.5 text-sm text-zinc-300">
                  {formatDate(invitation.expiresAt)}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="mt-7 flex flex-col gap-2">
          {!invalid ? (
            <>
              <Link
                href={`/cadastro?convite=${encodeURIComponent(token)}`}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-black"
              >
                Criar conta e participar
              </Link>

              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 px-5 text-sm font-semibold text-zinc-300"
              >
                Já tenho uma conta
              </Link>

              <button
                type="button"
                disabled={declining}
                onClick={() => void declineInvitation()}
                className="inline-flex h-11 items-center justify-center gap-2 text-sm text-zinc-600 hover:text-zinc-300 disabled:opacity-50"
              >
                {declining ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
                Recusar convite
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-black"
            >
              Ir para o login
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}