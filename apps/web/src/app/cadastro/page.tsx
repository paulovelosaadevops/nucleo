import Link from "next/link";
import { BrandSignature } from "@/components/brand/BrandSignature";
import { AppButton } from "@/components/ui/AppButton";
import { GlassCard } from "@/components/ui/GlassCard";

export default function CadastroPage() {
  return (
    <main className="authPage">
      <div className="glowLeft" />
      <div className="glowRight" />
      <div className="heroBackground" />

      <section className="authShell">
        <div className="authIntro">
          <BrandSignature size="lg" />

          <h1 className="authTitle">Crie o primeiro acesso da família.</h1>

          <p className="authDescription">
            O primeiro usuário será o administrador do NÚCLEO, responsável por
            convidar membros e configurar a central familiar.
          </p>

          <div className="authHighlights">
            <span>Administrador</span>
            <span>Convites</span>
            <span>Permissões</span>
          </div>
        </div>

        <GlassCard className="authCard">
          <div className="authCardHeader">
            <p className="eyebrow">Primeira configuração</p>
            <h2>Cadastro</h2>
            <p>Crie a base inicial da sua central familiar.</p>
          </div>

          <form className="form">
            <label>
              Seu nome
              <input type="text" placeholder="Paulo" />
            </label>

            <label>
              Nome da família
              <input type="text" placeholder="Família Bertão" />
            </label>

            <label>
              E-mail
              <input type="email" placeholder="seuemail@familia.com" />
            </label>

            <label>
              Senha
              <input type="password" placeholder="Crie uma senha segura" />
            </label>

            <AppButton type="submit">Criar NÚCLEO</AppButton>
          </form>

          <p className="authFooterText">
            Já tem acesso? <Link href="/login">Entrar</Link>
          </p>
        </GlassCard>
      </section>
    </main>
  );
}
