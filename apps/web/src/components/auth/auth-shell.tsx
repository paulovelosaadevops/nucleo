import { BrandMark } from "@/components/ui/brand-mark";
import {
  CalendarDays,
  ChartNoAxesCombined,
  HeartHandshake,
  ShoppingBasket,
} from "lucide-react";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

const features = [
  {
    icon: CalendarDays,
    title: "Rotina organizada",
    description:
      "Compromissos e lembretes da família em um só lugar.",
  },
  {
    icon: ShoppingBasket,
    title: "Compras compartilhadas",
    description:
      "Listas colaborativas sempre atualizadas.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Finanças transparentes",
    description:
      "Contas, cartões e orçamento sob controle.",
  },
];

export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden border-r border-white/[0.07] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          aria-hidden="true"
          className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/[0.07] blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-48 right-0 h-[30rem] w-[30rem] rounded-full bg-zinc-500/[0.08] blur-3xl"
        />

        <div className="relative z-10">
          <BrandMark />
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3.5 py-2 text-xs font-medium tracking-wide text-zinc-300">
            <HeartHandshake className="h-3.5 w-3.5" />
            A vida da família em sintonia
          </div>

          <h2 className="max-w-lg text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-white xl:text-5xl">
            Menos coisas para lembrar.
            <span className="block bg-gradient-to-r from-white via-zinc-300 to-zinc-600 bg-clip-text text-transparent">
              Mais tempo para viver.
            </span>
          </h2>

          <div className="mt-10 grid gap-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 backdrop-blur-xl"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-zinc-300">
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      {feature.title}
                    </p>

                    <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative z-10 text-xs text-zinc-600">
          Núcleo — Central Familiar
        </p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8 lg:px-12">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-white/[0.055] blur-3xl lg:hidden"
        />

        <div className="relative z-10 w-full max-w-md animate-fade-up">
          <div className="mb-10 flex justify-center lg:hidden">
            <BrandMark />
          </div>

          <div className="nucleo-glass rounded-[1.75rem] p-5 sm:p-8">
            <div className="mb-7">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Bem-vindo ao Núcleo
              </p>

              <h1 className="text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">
                {title}
              </h1>

              <p className="mt-2.5 text-sm leading-6 text-zinc-500">
                {description}
              </p>
            </div>

            {children}
          </div>

          {footer && (
            <div className="mt-6 text-center text-sm text-zinc-500">
              {footer}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}