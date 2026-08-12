import { BrandSignature } from "@/components/brand/BrandSignature";
import { AppButton } from "@/components/ui/AppButton";

export default function Home() {
  return (
    <main className="page">
      <section className="hero">
        <div className="glowLeft" />
        <div className="glowRight" />
        <div className="heroBackground" />

        <div className="heroGrid">
          <div>
            <div className="badge">
              <span className="badgeDot" />
              Central familiar privada
            </div>

            <BrandSignature size="lg" />

            <h1 className="title">A casa inteira organizada em um só lugar.</h1>

            <p className="description">
              Finanças, compras, agenda, tarefas, rotinas e decisões da família
              em uma experiência moderna, segura e feita exclusivamente para o
              nosso dia a dia.
            </p>

            <div className="actions">
              <AppButton href="/login">Entrar no NÚCLEO</AppButton>
              <AppButton href="/cadastro" variant="secondary">
                Criar acesso
              </AppButton>
            </div>
          </div>

          <div className="panel">
            <div className="panelInner">
              <div className="panelHeader">
                <div>
                  <p className="muted">Resumo familiar</p>
                  <h2 className="panelTitle">Hoje</h2>
                </div>

                <div className="status">Online</div>
              </div>

              <div className="cards">
                <div className="card">
                  <p className="muted">Saldo do mês</p>
                  <p className="cardValue">R$ 0,00</p>
                  <p className="cardHint">Finanças serão conectadas ao backend</p>
                </div>

                <div className="card">
                  <p className="muted">Agenda</p>
                  <p className="cardValue">0</p>
                  <p className="cardHint">Compromissos de hoje</p>
                </div>

                <div className="card">
                  <p className="muted">Compras</p>
                  <p className="cardValue">0</p>
                  <p className="cardHint">Itens pendentes</p>
                </div>

                <div className="card">
                  <p className="muted">Rotinas</p>
                  <p className="cardValue">0</p>
                  <p className="cardHint">Tarefas da família</p>
                </div>
              </div>

              <div className="nextStep">
                <p className="nextStepLabel">Próximo passo</p>
                <p className="nextStepText">
                  Construir o login privado da família.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
