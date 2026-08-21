"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getErrorMessage,
  isApiError,
} from "@/lib/api/api-error";
import { useAuth } from "@/hooks/use-auth";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

interface LoginErrors {
  email?: string;
  password?: string;
}

export function LoginForm() {
  const router = useRouter();

  const {
    login,
    isAuthenticated,
    isLoading,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [formError, setFormError] =
    useState<string | null>(null);
  const [errors, setErrors] =
    useState<LoginErrors>({});

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
    const nextErrors: LoginErrors = {};
    const normalizedEmail =
      email.trim().toLowerCase();

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

    if (!password) {
      nextErrors.password = "Informe sua senha";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
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
      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      router.replace("/inicio");
      router.refresh();
    } catch (error) {
      if (
        isApiError(error) &&
        error.status === 401
      ) {
        setFormError(
          "E-mail ou senha incorretos.",
        );
      } else {
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
      {formError && (
        <div
          role="alert"
          className="rounded-2xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-sm leading-5 text-red-200"
        >
          {formError}
        </div>
      )}

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

      <Input
        label="Senha"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        placeholder="Digite sua senha"
        value={password}
        error={errors.password}
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

      <Button
        type="submit"
        size="large"
        loading={submitting}
        className="mt-2 w-full"
      >
        Entrar
      </Button>
    </form>
  );
}