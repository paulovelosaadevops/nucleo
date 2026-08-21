import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/features/auth/register-form";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Criar conta",
};

interface CadastroPageProps {
  searchParams: Promise<{
    convite?: string | string[];
  }>;
}

export default async function CadastroPage({
  searchParams,
}: CadastroPageProps) {
  const parameters = await searchParams;

  const invitationParameter =
    parameters.convite;

  const invitationToken =
    typeof invitationParameter === "string"
      ? invitationParameter
      : invitationParameter?.[0];

  return (
    <AuthShell
      title={
        invitationToken
          ? "Faça parte do Núcleo"
          : "Crie sua central familiar"
      }
      description={
        invitationToken
          ? "Conclua seu cadastro para entrar no núcleo familiar que convidou você."
          : "Comece agora a organizar tudo o que importa para sua família."
      }
      footer={
        invitationToken ? (
          <p>
            O convite é pessoal e deve ser usado com
            o mesmo e-mail para o qual foi enviado.
          </p>
        ) : (
          <p>
            Já possui uma conta?{" "}
            <Link
              href="/login"
              className="font-medium text-zinc-200 transition hover:text-white"
            >
              Entrar
            </Link>
          </p>
        )
      }
    >
      <RegisterForm
        invitationToken={invitationToken}
      />
    </AuthShell>
  );
}