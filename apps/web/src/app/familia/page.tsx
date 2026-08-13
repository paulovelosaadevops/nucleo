"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AppButton } from "@/components/ui/AppButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { useCurrentFamily } from "@/hooks/useCurrentFamily";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAccessToken } from "@/lib/session";
import { familyInvitationService } from "@/services/familyInvitationService";
import type { FamilyInvitation } from "@/types/familyInvitation";

function getInitial(name?: string) {
  return name?.charAt(0).toUpperCase() ?? "P";
}

function getRoleLabel(role?: string) {
  if (role === "OWNER") {
    return "Administrador";
  }

  return "Membro";
}

function getStatusLabel(status: string) {
  if (status === "PENDING") {
    return "Pendente";
  }

  if (status === "ACCEPTED") {
    return "Aceito";
  }

  return "Revogado";
}

function getInvitationLink(token: string) {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}/aceitar-convite/${token}`;
}

export default function FamiliaPage() {
  const { user } = useCurrentUser();
  const { family } = useCurrentFamily();
  const [invitedEmail, setInvitedEmail] = useState("");
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [feedback, setFeedback] = useState("");
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
  const [revokingInvitationId, setRevokingInvitationId] = useState<string | null>(null);

  async function loadInvitations() {
    const token = getAccessToken();

    if (!token) {
      setIsLoadingInvitations(false);
      return;
    }

    setIsLoadingInvitations(true);

    try {
      const data = await familyInvitationService.list(token);
      setInvitations(data);
    } catch {
      setFeedback("Não foi possível carregar os convites.");
    } finally {
      setIsLoadingInvitations(false);
    }
  }

  async function handleCreateInvitation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getAccessToken();

    if (!token) {
      return;
    }

    setIsCreatingInvitation(true);
    setFeedback("");

    try {
      const invitation = await familyInvitationService.create(token, {
        invitedEmail,
        role: "MEMBER",
      });

      setInvitations((current) => [invitation, ...current]);
      setInvitedEmail("");
      setFeedback("Convite criado com sucesso.");
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o convite."
      );
    } finally {
      setIsCreatingInvitation(false);
    }
  }

  async function handleRevokeInvitation(invitationId: string) {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    setRevokingInvitationId(invitationId);
    setFeedback("");

    try {
      const updatedInvitation = await familyInvitationService.revoke(
        token,
        invitationId
      );

      setInvitations((current) =>
        current.map((invitation) =>
          invitation.id === invitationId ? updatedInvitation : invitation
        )
      );

      setFeedback("Convite revogado com sucesso.");
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível revogar o convite."
      );
    } finally {
      setRevokingInvitationId(null);
    }
  }

  async function handleCopyInvitationLink(invitation: FamilyInvitation) {
    const link = getInvitationLink(invitation.token);

    await navigator.clipboard.writeText(link);
    setFeedback("Link do convite copiado.");
  }

  useEffect(() => {
    loadInvitations();
  }, []);

  return (
    <AppShell active="familia">
      <header className="dashboardHeader">
        <div>
          <p className="eyebrow">Núcleo familiar</p>
          <h1>Família</h1>
          <p>Membros, convites, permissões e configurações da família.</p>
        </div>

        <div className="userPill">
          <span>{getRoleLabel(family?.role)}</span>
        </div>
      </header>

      <section className="familyGrid">
        <GlassCard className="familyPanel">
          <p className="eyebrow">Família principal</p>
          <h2>{family?.name ?? "Sua família"}</h2>
          <p>
            Ambiente privado para organizar a rotina, as finanças e as decisões
            familiares.
          </p>

          <div className="familyMembers">
            <div className="memberAvatar">{getInitial(user?.name)}</div>
            <div>
              <strong>{user?.name ?? "Usuário"}</strong>
              <span>{getRoleLabel(family?.role)}</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="dayPanel invitePanel">
          <p className="eyebrow">Novo convite</p>
          <h2>Convidar membro</h2>
          <p>
            Convide uma pessoa da família para acessar o NÚCLEO como membro.
          </p>

          <form className="compactForm" onSubmit={handleCreateInvitation}>
            <input
              type="email"
              placeholder="email@familia.com"
              value={invitedEmail}
              onChange={(event) => setInvitedEmail(event.target.value)}
              required
            />

            <AppButton type="submit">
              {isCreatingInvitation ? "Criando..." : "Criar convite"}
            </AppButton>
          </form>

          {feedback && <p className="formFeedback">{feedback}</p>}
        </GlassCard>

        <GlassCard className="dayPanel">
          <p className="eyebrow">Permissões</p>
          <h2>Controle familiar</h2>
          <p>
            Administrador convida membros. Nas próximas etapas, cada módulo terá
            permissões próprias.
          </p>
        </GlassCard>
      </section>

      <section className="setupPanel">
        <GlassCard className="wideCard">
          <p className="eyebrow">Convites enviados</p>
          <h2>Lista de convites</h2>

          {isLoadingInvitations ? (
            <p>Carregando convites...</p>
          ) : invitations.length === 0 ? (
            <p>Nenhum convite enviado até agora.</p>
          ) : (
            <div className="invitationList">
              {invitations.map((invitation) => (
                <div className="invitationItem" key={invitation.id}>
                  <div>
                    <strong>{invitation.invitedEmail}</strong>
                    <span>{getRoleLabel(invitation.role)}</span>

                    {invitation.status === "PENDING" && (
                      <code className="invitationLink">
                        {getInvitationLink(invitation.token)}
                      </code>
                    )}
                  </div>

                  <div className="invitationActions">
                    <em>{getStatusLabel(invitation.status)}</em>

                    {invitation.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          className="smallNeutralButton"
                          onClick={() => handleCopyInvitationLink(invitation)}
                        >
                          Copiar link
                        </button>

                        <button
                          type="button"
                          className="smallDangerButton"
                          onClick={() => handleRevokeInvitation(invitation.id)}
                          disabled={revokingInvitationId === invitation.id}
                        >
                          {revokingInvitationId === invitation.id
                            ? "Revogando..."
                            : "Revogar"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </section>
    </AppShell>
  );
}
