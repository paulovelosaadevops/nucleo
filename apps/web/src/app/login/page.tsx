"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandSignature } from "@/components/brand/BrandSignature";
import { AppButton } from "@/components/ui/AppButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { saveSession } from "@/lib/session";
import { authService } from "@/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setFeedback("");

    try {
      const auth = await authService.login({ email, password });
      saveSession(auth);
      router.replace("/dashboard");
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar no NÚCLEO."
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

            <label>
              Senha
              <input
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            <div className="formInlineAction">
              <Link href="/redefinir-senha">Esqueci minha senha</Link>
            </div>

            {feedback && <p className="formFeedback">{feedback}</p>}

            <AppButton type="submit">
              {isLoading ? "Entrando..." : "Entrar"}
            </AppButton>
          </form>

          <p className="authFooterText">
            Ainda não tem acesso? <Link href="/cadastro">Criar administrador</Link>
          </p>
        </GlassCard>
      </section>
    </main>
  );
}
