"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
  getErrorMessage,
  isApiError,
} from "@/lib/api/api-error";
import {
  Eye,
  EyeOff,
  House,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

interface RegisterFormProps {
  invitationToken?: string;
}

interface RegisterErrors {
  name?: string;
  email?: string;
  familyName?: string;
  password?: string;
  passwordConfirmation?: string;
}

export function RegisterForm({
  invitationToken,
}: RegisterFormProps) {
  const router = useRouter();

  const {
    register,
    isAuthenticated,
    isLoading,
  } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [familyName, setFamilyName] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [
    passwordConfirmation,
    setPasswordConfirmation,
  ] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [formError, setFormError] =
    useState<string | null>(null);
  const [errors, setErrors] =
    useState<RegisterErrors>({});

  const joiningFamily = Boolean(invitationToken);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/inicio");
    }
  }, [
    isAuthenticated,
    isLoading,
    router,
  ]);

  function validate(): boolean {
    const nextErrors: RegisterErrors = {};
    const normalizedName =
      name.trim().replace(/\s+/g, " ");
    const normalizedEmail =
      email.trim().toLowerCase();
    const normalizedFamilyName =
      familyName.trim().replace(/\s+/g, " ");

    if (normalizedName.length < 2) {
      nextErrors.name =
        "Informe seu nome completo";
    }

    if (!normalizedEmail) {
      nextErrors.email = "Informe seu e-mail";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail,
      )
    ) {
      nextErrors.email =
        "Informe um e-mail válido";
    }

    if (
      !joiningFamily &&
      normalizedFamilyName.length < 2
    ) {
      nextErrors.familyName =
        "Informe o nome do núcleo familiar";
    }

    if (password.length < 8) {
      nextErrors.password =
        "Use pelo menos 8 caracteres";
    } else if (
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password)
    ) {
      nextErrors.password =
        "Inclua letra maiúscula, minúscula e número";
    }

    if (
      passwordConfirmation !== password
    ) {
      nextErrors.passwordConfirmation =
        "As senhas não são iguais";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function applyBackendErrors(
    error: unknown,
  ): boolean {
    if (
      !isApiError(error) ||
      error.validationErrors.length === 0
    ) {
      return false;
    }

    const nextErrors: RegisterErrors = {};

    for (
      const validationError
      of error.validationErrors
    ) {
      const field =
        validationError.field as keyof RegisterErrors;

      if (field in errors || [
        "name",
        "email",
        "familyName",
        "password",
      ].includes(field)) {
        nextErrors[field] =
          validationError.message;
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length > 0;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError(null);

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      await register({
        name: name.trim().replace(/\s+/g, " "),
        email: email.trim().toLowerCase(),
        password,
        familyName: joiningFamily
          ? undefined
          : familyName
              .trim()
              .replace(/\s+/g, " "),
        invitationToken,
      });

      router.replace("/inicio");
      router.refresh();
    } catch (error) {
      if (!applyBackendErrors(error)) {
        setFormError(getErrorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit}
      noValidate
    >
      {joiningFamily && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm leading-5 text-zinc-300">
          Você está criando sua conta por meio
          de um convite familiar.
        </div>
      )}

      {formError && (
        <div
          role="alert"
          className="rounded-2xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-sm leading-5 text-red-200"
        >
          {formError}
        </div>
      )}

      <Input
        label="Seu nome"
        autoComplete="name"
        placeholder="Nome completo"
        value={name}
        error={errors.name}
        leadingIcon={
          <UserRound className="h-4 w-4" />
        }
        onChange={(event) => {
          setName(event.target.value);

          if (errors.name) {
            setErrors((current) => ({
              ...current,
              name: undefined,
            }));
          }
        }}
      />

      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="voce@email.com"
        value={email}
        error={errors.email}
        leadingIcon={
          <Mail className="h-4 w-4" />
        }
        onChange={(event) => {
          setEmail(event.target.value);

          if (errors.email) {
            setErrors((current) => ({
              ...current,
              email: undefined,
            }));
          }
        }}
      />

      {!joiningFamily && (
        <Input
          label="Nome do núcleo familiar"
          autoComplete="organization"
          placeholder="Ex.: Família Bertão"
          value={familyName}
          error={errors.familyName}
          leadingIcon={
            <House className="h-4 w-4" />
          }
          onChange={(event) => {
            setFamilyName(event.target.value);

            if (errors.familyName) {
              setErrors((current) => ({
                ...current,
                familyName: undefined,
              }));
            }
          }}
        />
      )}

      <Input
        label="Senha"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Mínimo de 8 caracteres"
        value={password}
        error={errors.password}
        hint="Use letra maiúscula, minúscula e número."
        leadingIcon={
          <LockKeyhole className="h-4 w-4" />
        }
        trailingElement={
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
            aria-label={
              showPassword
                ? "Ocultar senha"
                : "Mostrar senha"
            }
            onClick={() =>
              setShowPassword((current) => !current)
            }
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        }
        onChange={(event) => {
          setPassword(event.target.value);

          if (errors.password) {
            setErrors((current) => ({
              ...current,
              password: undefined,
            }));
          }
        }}
      />

      <Input
        label="Confirmar senha"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Digite a senha novamente"
        value={passwordConfirmation}
        error={errors.passwordConfirmation}
        leadingIcon={
          <LockKeyhole className="h-4 w-4" />
        }
        onChange={(event) => {
          setPasswordConfirmation(
            event.target.value,
          );

          if (errors.passwordConfirmation) {
            setErrors((current) => ({
              ...current,
              passwordConfirmation: undefined,
            }));
          }
        }}
      />

      <Button
        type="submit"
        size="large"
        loading={submitting}
        className="mt-2 w-full"
      >
        {joiningFamily
          ? "Criar conta e participar"
          : "Criar meu Núcleo"}
      </Button>

      <p className="px-2 text-center text-[0.7rem] leading-5 text-zinc-600">
        Ao continuar, você confirma que os
        dados informados são verdadeiros.
      </p>
    </form>
  );
}