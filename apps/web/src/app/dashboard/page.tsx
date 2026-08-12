import { BrandSignature } from "@/components/brand/BrandSignature";
import { GlassCard } from "@/components/ui/GlassCard";

const modules = [
  {
    title: "Finanças",
    value: "R$ 0,00",
    description: "Resumo financeiro do mês",
  },
  {
    title: "Compras",
    value: "0",
    description: "Itens pendentes no mercado",
  },
  {
    title: "Agenda",
    value: "0",
    description: "Compromissos de hoje",
  },
  {
    title: "Rotinas",
    value: "0",
    description: "Tarefas familiares abertas",
  },
];

const nextActions = [
  "Configurar família principal",
  "Cadastrar membros",
  "Criar categorias financeiras",
  "Montar primeira lista de compras",
];

export default function DashboardPage() {
  return (
    <main className="dashboardPage">
      <div className="dashboardGlow" />

      <aside className="sidebar">
        <BrandSignature size="sm" />

        <nav className="sidebarNav">
          <a className="active" href="#">Visão geral</a>
          <a href="#">Finanças</a>
          <a href="#">Compras</a>
          <a href="#">Agenda</a>
          <a href="#">Rotinas</a>
          <a href="#">Família</a>
        </nav>
      </aside>

      <section className="dashboardContent">
        <header className="dashboardHeader">
          <div>
            <p className="eyebrow">Central da Família</p>
            <h1>Bom dia, Paulo.</h1>
            <p>Este é o painel inicial do NÚCLEO.</p>
          </div>

          <div className="userPill">
            <span>Administrador</span>
          </div>
        </header>

        <div className="dashboardGrid">
          {modules.map((module) => (
            <GlassCard key={module.title} className="dashboardMetric">
              <p>{module.title}</p>
              <strong>{module.value}</strong>
              <span>{module.description}</span>
            </GlassCard>
          ))}
        </div>

        <div className="dashboardBottom">
          <GlassCard className="wideCard">
            <p className="eyebrow">Próximas ações</p>
            <h2>Fundação da família</h2>

            <div className="actionList">
              {nextActions.map((action) => (
                <div key={action} className="actionItem">
                  <span />
                  {action}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="wideCard accentCard">
            <p className="eyebrow">Status</p>
            <h2>Frontend em construção</h2>
            <p>
              Esta tela ainda usa dados estáticos visuais. A integração real
              será feita quando conectarmos o backend Spring Boot e o PostgreSQL.
            </p>
          </GlassCard>
        </div>
      </section>
    </main>
  );
}
