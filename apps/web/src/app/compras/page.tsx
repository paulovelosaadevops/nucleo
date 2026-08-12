import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";

const sections = [
  "Mercado",
  "Farmácia",
  "Casa",
  "Bebê",
];

export default function ComprasPage() {
  return (
    <AppShell active="compras">
      <header className="dashboardHeader">
        <div>
          <p className="eyebrow">Organização da casa</p>
          <h1>Compras</h1>
          <p>Listas de mercado, itens recorrentes e controle do que falta.</p>
        </div>

        <div className="userPill">
          <span>Lista vazia</span>
        </div>
      </header>

      <section className="moduleDetailGrid">
        <GlassCard className="wideCard">
          <p className="eyebrow">Lista atual</p>
          <h2>Nenhum item pendente</h2>
          <p>
            Futuramente, cada membro poderá adicionar itens e marcar compras
            como concluídas.
          </p>
        </GlassCard>

        <GlassCard className="wideCard accentCard">
          <p className="eyebrow">Categorias</p>
          <h2>Áreas de compra</h2>

          <div className="tagList">
            {sections.map((section) => (
              <span key={section}>{section}</span>
            ))}
          </div>
        </GlassCard>
      </section>
    </AppShell>
  );
}
