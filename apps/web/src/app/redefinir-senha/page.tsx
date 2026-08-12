"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandSignature } from "@/components/brand/BrandSignature";
import { AppButton } from "@/components/ui/AppButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { authService } from "@/services/authService";

export default function RedefinirSenhaPage() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setFeedback("");

    try {
      await authService.forgotPassword({ email });
      setFeedback("Se o e-mail estiver cadastrado, enviaremos as instruções.");
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível solicitar a redefinição."
      );
    } finally {
      setIsLoading(false);
    }
  }

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

          <form className="form" onSubmit={handleSubmit}>
            <label>
              E-mail
              <input
                type="email"
                placeholder="seuemail@familia.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            {feedback && <p className="formFeedback">{feedback}</p>}

            <AppButton type="submit">
              {isLoading ? "Enviando..." : "Enviar instruções"}
            </AppButton>
          </form>

          <p className="authFooterText">
            Lembrou sua senha? <Link href="/login">Voltar para login</Link>
          </p>
        </GlassCard>
      </section>
    </main>
  );
}
