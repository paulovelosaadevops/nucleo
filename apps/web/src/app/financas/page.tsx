import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";

const cards = [
  { label: "Saldo do mês", value: "R$ 0,00", hint: "Aguardando backend" },
  { label: "Entradas", value: "R$ 0,00", hint: "Receitas cadastradas" },
  { label: "Saídas", value: "R$ 0,00", hint: "Despesas cadastradas" },
  { label: "Categorias", value: "0", hint: "Categorias financeiras" },
];

export default function FinancasPage() {
  return (
    <AppShell active="financas">
      <header className="dashboardHeader">
        <div>
          <p className="eyebrow">Módulo financeiro</p>
          <h1>Finanças familiares</h1>
          <p>Contas, entradas, saídas, categorias e visão mensal da família.</p>
        </div>

        <div className="userPill">
          <span>Em construção</span>
        </div>
      </header>

      <section className="dashboardGrid">
        {cards.map((card) => (
          <GlassCard key={card.label} className="dashboardMetric">
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.hint}</span>
          </GlassCard>
        ))}
      </section>

      <section className="moduleDetailGrid">
        <GlassCard className="wideCard">
          <p className="eyebrow">Movimentações</p>
          <h2>Nenhuma movimentação cadastrada</h2>
          <p>
            Quando conectarmos o backend, esta área exibirá lançamentos reais,
            filtros por mês e categorias da família.
          </p>
        </GlassCard>

        <GlassCard className="wideCard accentCard">
          <p className="eyebrow">Próxima entrega</p>
          <h2>Modelo financeiro real</h2>
          <p>
            Vamos criar contas, categorias, transações e fechamento mensal sem
            dados mockados.
          </p>
        </GlassCard>
      </section>
    </AppShell>
  );
}
