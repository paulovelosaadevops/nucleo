"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandSignature } from "@/components/brand/BrandSignature";
import { AppButton } from "@/components/ui/AppButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { saveSession } from "@/lib/session";
import { publicFamilyInvitationService } from "@/services/publicFamilyInvitationService";
import type { PublicFamilyInvitation } from "@/types/publicFamilyInvitation";

function getStatusLabel(status?: string) {
  if (status === "PENDING") {
    return "Pendente";
  }

  if (status === "ACCEPTED") {
    return "Aceito";
  }

  if (status === "REVOKED") {
    return "Revogado";
  }

  return "Carregando";
}

export default function AceitarConvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;

  const [invitation, setInvitation] = useState<PublicFamilyInvitation | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    publicFamilyInvitationService
      .findByToken(token)
      .then((data) => {
        setInvitation(data);
      })
      .catch(() => {
        setFeedback("Convite não encontrado ou indisponível.");
      })
      .finally(() => {
        setIsLoadingInvitation(false);
      });
  }, [token]);

  async function handleAccept(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    setIsAccepting(true);
    setFeedback("");

    try {
      const auth = await publicFamilyInvitationService.accept(token, {
        name,
        password,
      });

      saveSession(auth);
      router.replace("/dashboard");
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível aceitar o convite."
      );
    } finally {
      setIsAccepting(false);
    }
  }

  const canAccept = invitation?.status === "PENDING";

  return (
    <main className="authPage">
      <div className="glowLeft" />
      <div className="glowRight" />
      <div className="heroBackground" />

      <section className="authShell">
        <div className="authIntro">
          <BrandSignature size="lg" />

          <h1 className="authTitle">Você foi convidado para o NÚCLEO.</h1>

          <p className="authDescription">
            Crie seu acesso para entrar na central familiar e participar da
            organização da casa.
          </p>

          <div className="authHighlights">
            <span>Convite privado</span>
            <span>Acesso familiar</span>
            <span>Conta segura</span>
          </div>
        </div>

        <GlassCard className="authCard">
          <div className="authCardHeader">
            <p className="eyebrow">Aceitar convite</p>
            <h2>
              {isLoadingInvitation
                ? "Carregando"
                : invitation?.familyName ?? "Convite"}
            </h2>
            <p>Status: {getStatusLabel(invitation?.status)}</p>
          </div>

          {canAccept ? (
            <form className="form" onSubmit={handleAccept}>
              <label>
                E-mail convidado
                <input type="email" value={invitation.invitedEmail} readOnly />
              </label>

              <label>
                Seu nome
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>

              <label>
                Senha
                <input
                  type="password"
                  placeholder="Crie uma senha segura"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                />
              </label>

              {feedback && <p className="formFeedback">{feedback}</p>}

              <AppButton type="submit">
                {isAccepting ? "Entrando..." : "Aceitar convite"}
              </AppButton>
            </form>
          ) : (
            <div className="emptyState">
              <p>{feedback || "Este convite não está disponível para aceite."}</p>

              <Link href="/login">Voltar para login</Link>
            </div>
          )}
        </GlassCard>
      </section>
    </main>
  );
}
