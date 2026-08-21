"use client";

import { FormEvent, useState } from "react";
import {
  Check,
  Copy,
  LoaderCircle,
  MailPlus,
  X,
} from "lucide-react";

import type {
  CreateFamilyInvitationRequest,
  FamilyInvitationCreated,
  FamilyRole,
} from "@/types/family";

interface FamilyInvitationFormProps {
  submitting?: boolean;
  onSubmit: (
    request: CreateFamilyInvitationRequest,
  ) => Promise<FamilyInvitationCreated>;
  onCancel: () => void;
}

const inputClassName =
  "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-white/25 disabled:opacity-50";

const labelClassName =
  "mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500";

export function FamilyInvitationForm({
  submitting = false,
  onSubmit,
  onCancel,
}: FamilyInvitationFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<FamilyRole, "OWNER">>(
    "MEMBER",
  );

  const [result, setResult] =
    useState<FamilyInvitationCreated | null>(null);

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      setError("Informe um e-mail válido.");
      return;
    }

    try {
      const response = await onSubmit({
        email: normalizedEmail,
        role,
      });

      setResult(response);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Não foi possível criar o convite.",
      );
    }
  }

  async function copyInvitationLink() {
    if (!result) {
      return;
    }

    const localInvitationUrl = `${window.location.origin}/convites/${result.invitationToken}`;

    await navigator.clipboard.writeText(localInvitationUrl);
    setCopied(true);

    window.setTimeout(() => setCopied(false), 2000);
  }

  if (result) {
    const localInvitationUrl =
      typeof window === "undefined"
        ? result.invitationUrl
        : `${window.location.origin}/convites/${result.invitationToken}`;

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6">
        <section className="w-full rounded-t-[2rem] border border-white/10 bg-[#090909] p-6 sm:max-w-xl sm:rounded-[2rem] sm:p-7">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
            <Check className="size-5" />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-white">
            Convite criado
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Compartilhe o link abaixo com{" "}
            <span className="text-zinc-300">
              {result.invitation.email}
            </span>
            .
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="break-all font-mono text-xs leading-6 text-zinc-400">
              {localInvitationUrl}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="h-11 rounded-2xl border border-white/10 px-5 text-sm font-semibold text-zinc-300"
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={() => void copyInvitationLink()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-black"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}

              {copied ? "Link copiado" : "Copiar link"}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6">
      <section className="w-full rounded-t-[2rem] border border-white/10 bg-[#090909] sm:max-w-xl sm:rounded-[2rem]">
        <header className="flex items-start justify-between border-b border-white/10 p-5 sm:px-7">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Núcleo familiar
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Convidar familiar
            </h2>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={onCancel}
            className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400"
          >
            <X className="size-4" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-5 sm:p-7"
        >
          <div>
            <label
              htmlFor="invitation-email"
              className={labelClassName}
            >
              E-mail
            </label>

            <input
              id="invitation-email"
              type="email"
              value={email}
              autoFocus
              maxLength={254}
              disabled={submitting}
              placeholder="familiar@exemplo.com"
              onChange={(event) => setEmail(event.target.value)}
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="invitation-role"
              className={labelClassName}
            >
              Papel
            </label>

            <select
              id="invitation-role"
              value={role}
              disabled={submitting}
              onChange={(event) =>
                setRole(
                  event.target.value as Exclude<
                    FamilyRole,
                    "OWNER"
                  >,
                )
              }
              className={inputClassName}
            >
              <option value="MEMBER">Membro</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex gap-3">
              <MailPlus className="mt-0.5 size-4 shrink-0 text-zinc-400" />

              <p className="text-xs leading-6 text-zinc-500">
                Administradores podem gerenciar convites. Membros
                participam da Agenda, Compras e Finanças, mas não
                administram o núcleo.
              </p>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-4 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <footer className="flex flex-col-reverse gap-2 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={submitting}
              onClick={onCancel}
              className="h-11 rounded-2xl border border-white/10 px-5 text-sm font-semibold text-zinc-300"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-semibold text-black disabled:opacity-60"
            >
              {submitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <MailPlus className="size-4" />
              )}

              Criar convite
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}