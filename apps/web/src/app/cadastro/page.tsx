"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandSignature } from "@/components/brand/BrandSignature";
import { AppButton } from "@/components/ui/AppButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { saveSession } from "@/lib/session";
import { authService } from "@/services/authService";

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setFeedback("");

    try {
      const auth = await authService.register({ name, familyName, email, password });
      saveSession(auth);
      router.replace("/dashboard");
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o NÚCLEO."
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

          <form className="form" onSubmit={handleSubmit}>
            <label>
              Seu nome
              <input
                type="text"
                placeholder="Paulo"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

            <label>
              Nome da família
              <input
                type="text"
                placeholder="Família Bertão"
                value={familyName}
                onChange={(event) => setFamilyName(event.target.value)}
                required
              />
            </label>

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
                placeholder="Crie uma senha segura"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {feedback && <p className="formFeedback">{feedback}</p>}

            <AppButton type="submit">
              {isLoading ? "Criando..." : "Criar NÚCLEO"}
            </AppButton>
          </form>

          <p className="authFooterText">
            Já tem acesso? <Link href="/login">Entrar</Link>
          </p>
        </GlassCard>
      </section>
    </main>
  );
}
