import Link from "next/link";
import { BrandSignature } from "@/components/brand/BrandSignature";
import { AppButton } from "@/components/ui/AppButton";
import { GlassCard } from "@/components/ui/GlassCard";

export default function LoginPage() {
  return (
    <main className="authPage">
      <div className="glowLeft" />
      <div className="glowRight" />
      <div className="heroBackground" />

      <section className="authShell">
        <div className="authIntro">
          <BrandSignature size="lg" />

          <h1 className="authTitle">Entre na central da sua família.</h1>

          <p className="authDescription">
            Acesse o NÚCLEO para acompanhar finanças, agenda, compras e rotinas
            familiares em um ambiente privado e seguro.
          </p>

          <div className="authHighlights">
            <span>Privado</span>
            <span>Responsivo</span>
            <span>Organizado</span>
          </div>
        </div>

        <GlassCard className="authCard">
          <div className="authCardHeader">
            <p className="eyebrow">Acesso familiar</p>
            <h2>Login</h2>
            <p>Use seu e-mail e senha para entrar.</p>
          </div>

          <form className="form">
            <label>
              E-mail
              <input type="email" placeholder="seuemail@familia.com" />
            </label>

            <label>
              Senha
              <input type="password" placeholder="Digite sua senha" />
            </label>

            <AppButton type="submit">Entrar</AppButton>
          </form>

          <p className="authFooterText">
            Ainda não tem acesso? <Link href="/cadastro">Criar administrador</Link>
          </p>
        </GlassCard>
      </section>
    </main>
  );
}
