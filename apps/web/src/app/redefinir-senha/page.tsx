import Link from "next/link";
import { BrandSignature } from "@/components/brand/BrandSignature";
import { AppButton } from "@/components/ui/AppButton";
import { GlassCard } from "@/components/ui/GlassCard";

export default function RedefinirSenhaPage() {
  return (
    <main className="authPage">
      <div className="glowLeft" />
      <div className="glowRight" />
      <div className="heroBackground" />

      <section className="authShell">
        <div className="authIntro">
          <BrandSignature size="lg" />

          <h1 className="authTitle">Recupere o acesso ao NÚCLEO.</h1>

          <p className="authDescription">
            Informe o e-mail cadastrado e enviaremos as instruções para
            redefinir sua senha com segurança.
          </p>

          <div className="authHighlights">
            <span>Seguro</span>
            <span>Privado</span>
            <span>Verificado por e-mail</span>
          </div>
        </div>

        <GlassCard className="authCard">
          <div className="authCardHeader">
            <p className="eyebrow">Redefinição de senha</p>
            <h2>Recuperar acesso</h2>
            <p>Digite o e-mail usado no cadastro.</p>
          </div>

          <form className="form">
            <label>
              E-mail
              <input type="email" placeholder="seuemail@familia.com" />
            </label>

            <AppButton type="submit">Enviar instruções</AppButton>
          </form>

          <p className="authFooterText">
            Lembrou sua senha? <Link href="/login">Voltar para login</Link>
          </p>
        </GlassCard>
      </section>
    </main>
  );
}
