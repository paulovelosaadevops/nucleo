import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";

export default function FamiliaPage() {
  return (
    <AppShell active="familia">
      <header className="dashboardHeader">
        <div>
          <p className="eyebrow">Núcleo familiar</p>
          <h1>Família</h1>
          <p>Membros, convites, permissões e configurações da família.</p>
        </div>

        <div className="userPill">
          <span>Administrador</span>
        </div>
      </header>

      <section className="familyGrid">
        <GlassCard className="familyPanel">
          <p className="eyebrow">Família principal</p>
          <h2>Família Bertão</h2>
          <p>
            Ambiente privado para organizar a rotina, as finanças e as decisões
            familiares.
          </p>

          <div className="familyMembers">
            <div className="memberAvatar">P</div>
            <div>
              <strong>Paulo</strong>
              <span>Administrador</span>
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
