"use client";

import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { useCurrentFamily } from "@/hooks/useCurrentFamily";
import { useCurrentUser } from "@/hooks/useCurrentUser";

function getInitial(name?: string) {
  return name?.charAt(0).toUpperCase() ?? "P";
}

function getRoleLabel(role?: string) {
  if (role === "OWNER") {
    return "Administrador";
  }

  return "Membro";
}

export default function FamiliaPage() {
  const { user } = useCurrentUser();
  const { family } = useCurrentFamily();

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

        <GlassCard className="dayPanel">
          <p className="eyebrow">Convites</p>
          <h2>Nenhum convite enviado</h2>
          <p>
            Depois do backend, o administrador poderá convidar membros por e-mail.
          </p>
        </GlassCard>

        <GlassCard className="dayPanel">
          <p className="eyebrow">Permissões</p>
          <h2>Controle familiar</h2>
          <p>
            Vamos separar administrador, membro e permissões por módulo.
          </p>
        </GlassCard>
      </section>
    </AppShell>
  );
}
