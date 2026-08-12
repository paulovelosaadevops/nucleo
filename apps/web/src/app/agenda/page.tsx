import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";

const agendaTypes = [
  "Consultas",
  "Vencimentos",
  "Eventos",
  "Lembretes",
];

export default function AgendaPage() {
  return (
    <AppShell active="agenda">
      <header className="dashboardHeader">
        <div>
          <p className="eyebrow">Agenda familiar</p>
          <h1>Agenda</h1>
          <p>Compromissos, consultas, vencimentos e lembretes importantes.</p>
        </div>

        <div className="userPill">
          <span>Hoje: 0</span>
        </div>
      </header>

      <section className="moduleDetailGrid">
        <GlassCard className="wideCard">
          <p className="eyebrow">Hoje</p>
          <h2>Nenhum compromisso conectado</h2>
          <p>
            Esta área será integrada ao backend para exibir eventos reais da
            família.
          </p>
        </GlassCard>

        <GlassCard className="wideCard accentCard">
          <p className="eyebrow">Tipos de agenda</p>
          <h2>Organização por contexto</h2>

          <div className="tagList">
            {agendaTypes.map((type) => (
              <span key={type}>{type}</span>
            ))}
          </div>
        </GlassCard>
      </section>
    </AppShell>
  );
}
