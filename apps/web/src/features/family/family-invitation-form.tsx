"use client";

import {
  useState,
  type FormEvent,
} from "react";
import {
  Check,
  Copy,
  MailPlus,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function buildInvitationUrl(
  invitation: FamilyInvitationCreated,
) {
  if (typeof window === "undefined") {
    return invitation.invitationUrl;
  }

  return `${window.location.origin}/convites/${encodeURIComponent(
    invitation.invitationToken,
  )}`;
}

export function FamilyInvitationForm({
  submitting = false,
  onSubmit,
  onCancel,
}: FamilyInvitationFormProps) {
  const [email, setEmail] = useState("");

  const [role, setRole] =
    useState<Exclude<FamilyRole, "OWNER">>(
      "MEMBER",
    );

  const [result, setResult] =
    useState<FamilyInvitationCreated | null>(
      null,
    );

  const [copied, setCopied] = useState(false);

  const [emailError, setEmailError] =
    useState<string | undefined>();

  const [formError, setFormError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setEmailError(undefined);
    setFormError(null);

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setEmailError("Informe o e-mail");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail,
      )
    ) {
      setEmailError("Informe um e-mail válido");
      return;
    }

    try {
      const response = await onSubmit({
        email: normalizedEmail,
        role,
      });

      setResult(response);
    } catch (submissionError) {
      setFormError(
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

    setFormError(null);

    try {
      await navigator.clipboard.writeText(
        buildInvitationUrl(result),
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setFormError(
        "Não foi possível copiar o link. Selecione e copie o endereço manualmente.",
      );
    }
  }

  if (result) {
    const invitationUrl =
      buildInvitationUrl(result);

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="invitation-created-title"
          className="w-full rounded-t-[2rem] border border-white/10 bg-[#090909] p-6 shadow-2xl sm:max-w-xl sm:rounded-[2rem] sm:p-7"
        >
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
            <Check className="size-5" />
          </div>

          <h2
            id="invitation-created-title"
            className="mt-5 text-xl font-semibold text-white"
          >
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
              {invitationUrl}
            </p>
          </div>

          {formError ? (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-4 text-sm leading-6 text-red-200"
            >
              {formError}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
            >
              Fechar
            </Button>

            <Button
              type="button"
              onClick={() =>
                void copyInvitationLink()
              }
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}

              {copied
                ? "Link copiado"
                : "Copiar link"}
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="invitation-form-title"
        className="w-full rounded-t-[2rem] border border-white/10 bg-[#090909] shadow-2xl sm:max-w-xl sm:rounded-[2rem]"
      >
        <header className="flex items-start justify-between border-b border-white/10 p-5 sm:px-7">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Núcleo familiar
            </p>

            <h2
              id="invitation-form-title"
              className="mt-1 text-xl font-semibold text-white"
            >
              Convidar familiar
            </h2>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={submitting}
            aria-label="Fechar formulário de convite"
            onClick={onCancel}
          >
            <X className="size-4" />
          </Button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-5 sm:p-7"
          noValidate
        >
          <Input
            id="invitation-email"
            label="E-mail"
            type="email"
            autoFocus
            required
            maxLength={254}
            autoComplete="email"
            inputMode="email"
            disabled={submitting}
            placeholder="familiar@exemplo.com"
            value={email}
            error={emailError}
            onChange={(event) => {
              setEmail(event.target.value);

              if (emailError) {
                setEmailError(undefined);
              }

              if (formError) {
                setFormError(null);
              }
            }}
          />

          <div>
            <label
              htmlFor="invitation-role"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Papel no núcleo
            </label>

            <select
              id="invitation-role"
              value={role}
              disabled={submitting}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-[0.95rem] text-white outline-none transition hover:border-white/16 focus:border-white/30 focus:bg-white/[0.065] focus:ring-2 focus:ring-white/[0.06] disabled:opacity-50"
              onChange={(event) => {
                const selectedRole =
                  event.target.value;

                if (
                  selectedRole === "MEMBER" ||
                  selectedRole === "ADMIN"
                ) {
                  setRole(selectedRole);
                }
              }}
            >
              <option value="MEMBER">
                Membro
              </option>

              <option value="ADMIN">
                Administrador
              </option>
            </select>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex gap-3">
              <MailPlus className="mt-0.5 size-4 shrink-0 text-zinc-400" />

              <p className="text-xs leading-6 text-zinc-500">
                Administradores podem gerenciar
                convites. Membros participam da
                Agenda, Compras e Finanças, mas não
                administram o núcleo.
              </p>
            </div>
          </div>

          {formError ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-4 text-sm leading-6 text-red-200"
            >
              {formError}
            </div>
          ) : null}

          <footer className="flex flex-col-reverse gap-2 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={onCancel}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              loading={submitting}
            >
              <MailPlus className="size-4" />
              Criar convite
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}