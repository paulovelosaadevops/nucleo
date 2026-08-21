import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/features/auth/login-form";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Entre na sua central"
      description="Acesse a rotina, as compras e as finanças da sua família."
      footer={
        <p>
          Ainda não possui uma conta?{" "}
          <Link
            href="/cadastro"
            className="font-medium text-zinc-200 transition hover:text-white"
          >
            Criar meu Núcleo
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}