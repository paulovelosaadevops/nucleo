import { BrandSignature } from "@/components/brand/BrandSignature";
import { GlassCard } from "@/components/ui/GlassCard";

const modules = [
  {
    key: "FIN",
    title: "Finanças",
    description: "Contas, entradas, saídas, categorias e resumo mensal.",
    status: "Em breve",
  },
  {
    key: "COM",
    title: "Compras",
    description: "Lista de mercado, itens recorrentes e organização da casa.",
    status: "Em breve",
  },
  {
    key: "AGE",
    title: "Agenda",
    description: "Compromissos, consultas, eventos e lembretes familiares.",
    status: "Em breve",
  },
  {
    key: "ROT",
    title: "Rotinas",
    description: "Tarefas da casa, cuidados, combinados e responsabilidades.",
    status: "Em breve",
  },
];

const setupSteps = [
  "Conectar backend Spring Boot",
  "Criar autenticação real",
  "Cadastrar família principal",
  "Criar primeiro módulo financeiro",
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
        <header className="dashboardHeader dashboardHeroHeader">
          <div>
            <p className="eyebrow">Central da Família</p>
            <h1>Bom dia, Paulo.</h1>
            <p>
              Este é o painel inicial do NÚCLEO. A partir daqui vamos conectar
              cada área real da rotina familiar.
            </p>
          </div>

          <div className="userPill">
            <span>Administrador</span>
          </div>
        </header>

        <section className="overviewStrip">
          <GlassCard className="overviewPrimary">
            <p className="eyebrow">Status geral</p>
            <h2>Ambiente familiar em configuração</h2>
            <p>
              O frontend inicial já está estruturado. O próximo grande marco é
              conectar autenticação, família e banco de dados.
            </p>
          </GlassCard>

          <GlassCard className="overviewMini">
            <p>Família</p>
            <strong>1</strong>
            <span>Administrador inicial</span>
          </GlassCard>

          <GlassCard className="overviewMini">
            <p>Módulos</p>
            <strong>4</strong>
            <span>Planejados na primeira fase</span>
          </GlassCard>
        </section>

        <section className="moduleHub">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">Módulos</p>
              <h2>Organização completa da casa</h2>
            </div>

            <span>Fase visual</span>
          </div>

          <div className="moduleGrid">
            {modules.map((module) => (
              <GlassCard key={module.key} className="moduleCard">
                <div className="moduleIcon">{module.key}</div>

                <div>
                  <div className="moduleCardHeader">
                    <h3>{module.title}</h3>
                    <span>{module.status}</span>
                  </div>

                  <p>{module.description}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        <section className="familyGrid">
          <GlassCard className="familyPanel">
            <p className="eyebrow">Família</p>
            <h2>Família Bertão</h2>
            <p>
              O primeiro administrador será responsável por convidar membros,
              definir permissões e configurar o ambiente familiar.
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
            <p className="eyebrow">Hoje</p>
            <h2>Sem compromissos conectados</h2>
            <p>
              Quando a agenda for integrada, esta área mostrará consultas,
              vencimentos, lembretes e eventos do dia.
            </p>
          </GlassCard>

          <GlassCard className="dayPanel">
            <p className="eyebrow">Compras</p>
            <h2>Lista ainda vazia</h2>
            <p>
              O módulo de compras será usado para mercado, farmácia, casa e
              itens recorrentes da família.
            </p>
          </GlassCard>
        </section>

        <section className="setupPanel">
          <GlassCard className="wideCard">
            <p className="eyebrow">Próximos passos técnicos</p>
            <h2>Fundação real do sistema</h2>

            <div className="actionList">
              {setupSteps.map((step) => (
                <div key={step} className="actionItem">
                  <span />
                  {step}
                </div>
              ))}
            </div>
          </GlassCard>
        </section>
      </section>
    </main>
  );
}
