"use client";

import {
  useEffect,
  useState,
} from "react";
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

import {
  Button,
  buttonClassName,
} from "@/components/ui/button";
import type {
  FamilyInvitationPreview,
  InvitationStatus,
} from "@/types/family";

import { familyService } from "./family-service";

interface InvitationPreviewProps {
  token: string;
}

const unavailableContent: Record<
  Exclude<InvitationStatus, "PENDING">,
  {
    title: string;
    description: string;
  }
> = {
  ACCEPTED: {
    title: "Convite já aceito",
    description:
      "Este convite já foi utilizado para entrar no núcleo familiar.",
  },
  DECLINED: {
    title: "Convite recusado",
    description:
      "Este convite foi recusado e não pode mais ser utilizado.",
  },
  REVOKED: {
    title: "Convite revogado",
    description:
      "O administrador do núcleo revogou este convite.",
  },
  EXPIRED: {
    title: "Convite expirado",
    description:
      "O prazo para utilizar este convite terminou.",
  },
};

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

  const [
    confirmingDecline,
    setConfirmingDecline,
  ] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInvitation() {
      try {
        const response =
          await familyService.invitations.preview(token);

        if (active) {
          setInvitation(response);
        }
      } catch (requestError) {
        if (active) {
          setInvitation(null);

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
  }, [reloadKey, token]);

  function retryInvitation() {
    setLoading(true);
    setError(null);

    setReloadKey(
      (current) => current + 1,
    );
  }

  async function declineInvitation() {
    setDeclining(true);
    setError(null);

    try {
      await familyService.invitations.decline(token);

      setInvitation((current) =>
        current
          ? {
              ...current,
              status: "DECLINED",
            }
          : current,
      );

      setConfirmingDecline(false);
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
      <main
        aria-busy="true"
        aria-live="polite"
        className="flex min-h-dvh items-center justify-center bg-black"
      >
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <LoaderCircle className="size-7 animate-spin" />

          <p className="text-sm">
            Carregando convite...
          </p>
        </div>
      </main>
    );
  }

  if (error || !invitation) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-black p-5">
        <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 text-center shadow-2xl backdrop-blur-xl">
          <AlertCircle className="mx-auto size-9 text-rose-300" />

          <h1 className="mt-5 text-xl font-semibold text-white">
            Não foi possível carregar o convite
          </h1>

          <p
            role="alert"
            className="mt-3 text-sm leading-6 text-zinc-500"
          >
            {error ??
              "O convite não pôde ser encontrado."}
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Button
              type="button"
              size="large"
              onClick={retryInvitation}
            >
              Tentar novamente
            </Button>

            <Link
              href="/login"
              className={buttonClassName({
                variant: "secondary",
                size: "large",
                className: "w-full",
              })}
            >
              Ir para o login
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const pending =
    invitation.status === "PENDING";

  const unavailable =
    invitation.status === "PENDING"
      ? null
      : unavailableContent[invitation.status];

  const roleLabel =
    invitation.role === "ADMIN"
      ? "Administrador"
      : "Membro";

  const RoleIcon =
    invitation.role === "ADMIN"
      ? ShieldCheck
      : UserRound;

  const successfulStatus =
    invitation.status === "PENDING" ||
    invitation.status === "ACCEPTED";

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-black p-5">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]"
      />

      <section className="relative w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-white">
          {successfulStatus ? (
            <Check className="size-5" />
          ) : (
            <X className="size-5" />
          )}
        </div>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-zinc-600">
          Convite para o Núcleo
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          {pending
            ? `Você foi convidado para ${invitation.familyName}`
            : unavailable?.title}
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          {pending
            ? `${invitation.invitedByName} convidou ${invitation.maskedEmail} para participar da central familiar.`
            : unavailable?.description}
        </p>

        {pending ? (
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
                  {formatDate(
                    invitation.expiresAt,
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-4 text-sm text-rose-200"
          >
            {error}
          </div>
        ) : null}

        <div className="mt-7 flex flex-col gap-2">
          {pending ? (
            <>
              <Link
                href={`/cadastro?convite=${encodeURIComponent(token)}`}
                className={buttonClassName({
                  size: "large",
                  className: "w-full",
                })}
              >
                Criar conta e participar
              </Link>

              {!confirmingDecline ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="large"
                  className="w-full text-zinc-500"
                  onClick={() =>
                    setConfirmingDecline(true)
                  }
                >
                  Recusar convite
                </Button>
              ) : (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-4">
                  <p className="text-sm leading-6 text-zinc-300">
                    Deseja realmente recusar este
                    convite?
                  </p>

                  <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={declining}
                      onClick={() =>
                        setConfirmingDecline(false)
                      }
                    >
                      Voltar
                    </Button>

                    <Button
                      type="button"
                      variant="danger"
                      loading={declining}
                      onClick={() =>
                        void declineInvitation()
                      }
                    >
                      Confirmar recusa
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className={buttonClassName({
                size: "large",
                className: "w-full",
              })}
            >
              Ir para o login
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}