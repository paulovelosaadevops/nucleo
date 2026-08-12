import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";

const routineAreas = [
  "Casa",
  "Bernardo",
  "Pets",
  "Contas",
  "Manutenção",
];

export default function RotinasPage() {
  return (
    <AppShell active="rotinas">
      <header className="dashboardHeader">
        <div>
          <p className="eyebrow">Rotina familiar</p>
          <h1>Rotinas</h1>
          <p>Tarefas, responsabilidades, cuidados e combinados da casa.</p>
        </div>

        <div className="userPill">
          <span>0 tarefas</span>
        </div>
      </header>

      <section className="moduleDetailGrid">
        <GlassCard className="wideCard">
          <p className="eyebrow">Tarefas abertas</p>
          <h2>Nenhuma rotina cadastrada</h2>
          <p>
            Vamos permitir recorrência, responsáveis e acompanhamento por membro
            da família.
          </p>
        </GlassCard>

        <GlassCard className="wideCard accentCard">
          <p className="eyebrow">Áreas de rotina</p>
          <h2>Organização prática</h2>

          <div className="tagList">
            {routineAreas.map((area) => (
              <span key={area}>{area}</span>
            ))}
          </div>
        </GlassCard>
      </section>
    </AppShell>
  );
}
