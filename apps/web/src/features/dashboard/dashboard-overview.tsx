"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Surface } from "@/components/ui/surface";
import { DashboardAgenda } from "@/features/dashboard/dashboard-agenda";
import { DashboardFinance } from "@/features/dashboard/dashboard-finance";
import { DashboardShopping } from "@/features/dashboard/dashboard-shopping";
import { DashboardSummaryCard } from "@/features/dashboard/dashboard-summary-card";
import { useDashboard } from "@/features/dashboard/use-dashboard";
import { useAuth } from "@/hooks/use-auth";
import {
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  PiggyBank,
  Plus,
  RefreshCw,
  ShoppingBasket,
} from "lucide-react";
import Link from "next/link";

const currencyFormatter =
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

export function DashboardOverview() {
  const { session } = useAuth();

  const {
    data,
    loading,
    refreshing,
    error,
    refresh,
  } = useDashboard();

  const firstName =
    session?.user.name
      .trim()
      .split(/\s+/)[0] ?? "";

  const unavailable = (
    section:
      | "agenda"
      | "shopping"
      | "finance"
      | "notifications",
  ) =>
    data?.unavailableSections.includes(
      section,
    ) ?? false;

  const pendingShoppingItems =
    data?.shoppingLists.reduce(
      (total, list) =>
        total + list.pendingItems,
      0,
    ) ?? 0;

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <Surface
          variant="elevated"
          className="max-w-md text-center"
        >
          <p className="text-base font-medium text-white">
            Não foi possível carregar sua central
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {error}
          </p>

          <Button
            variant="secondary"
            className="mt-5"
            loading={refreshing}
            onClick={() => void refresh()}
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </Surface>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-7">
      <PageHeader
        eyebrow={session?.family.name}
        title={`Olá, ${firstName}`}
        description="Aqui está o que está acontecendo no seu Núcleo."
        action={
          <Button
            variant="ghost"
            size="icon"
            loading={refreshing}
            onClick={() => void refresh()}
            aria-label="Atualizar painel"
          >
            {!refreshing && (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <QuickAction
          href="/agenda?novo=true"
          label="Novo compromisso"
          icon={CalendarDays}
        />

        <QuickAction
          href="/compras?nova=true"
          label="Nova lista"
          icon={ShoppingBasket}
        />

        <QuickAction
          href="/financas?novo=true"
          label="Nova movimentação"
          icon={Plus}
        />
      </div>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <DashboardSummaryCard
          title="Próximos eventos"
          value={String(data?.agenda.length ?? 0)}
          detail="Nos próximos 7 dias"
          href="/agenda"
          icon={CalendarDays}
          unavailable={unavailable("agenda")}
        />

        <DashboardSummaryCard
          title="Itens pendentes"
          value={String(pendingShoppingItems)}
          detail="Nas listas em andamento"
          href="/compras"
          icon={ShoppingBasket}
          unavailable={unavailable("shopping")}
        />

        <DashboardSummaryCard
          title="Saldo das contas"
          value={currencyFormatter.format(
            data?.finance
              ?.availableAccountBalance ?? 0,
          )}
          detail="Posição financeira atual"
          href="/financas"
          icon={ChartNoAxesCombined}
          unavailable={unavailable("finance")}
        />

        <DashboardSummaryCard
          title="Investimentos"
          value={currencyFormatter.format(
            data?.finance
              ?.investmentSummary
              ?.investedBalance ?? 0,
          )}
          detail={`${currencyFormatter.format(data?.finance?.investmentSummary?.accumulatedYield ?? 0)} acumulado · ${data?.finance?.investmentSummary?.activeProductCount ?? 0} produto(s)`}
          href="/financas?secao=investments"
          icon={PiggyBank}
          unavailable={unavailable("finance")}
        />

        <DashboardSummaryCard
          title="Notificações"
          value={String(
            data?.unreadNotifications ?? 0,
          )}
          detail="Ainda não visualizadas"
          href="/notificacoes"
          icon={Bell}
          unavailable={unavailable(
            "notifications",
          )}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardAgenda
          occurrences={data?.agenda ?? []}
          unavailable={unavailable("agenda")}
        />

        <div className="grid gap-4">
          <DashboardShopping
            lists={data?.shoppingLists ?? []}
            unavailable={unavailable(
              "shopping",
            )}
          />

          <DashboardFinance
            finance={data?.finance ?? null}
            unavailable={unavailable("finance")}
          />
        </div>
      </section>
    </div>
  );
}

interface QuickActionProps {
  href: string;
  label: string;
  icon: typeof Plus;
}

function QuickAction({
  href,
  label,
  icon: Icon,
}: QuickActionProps) {
  return (
    <Link
      href={href}
      className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 text-xs font-medium text-zinc-400 transition hover:border-white/15 hover:bg-white/[0.065] hover:text-white"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-7">
      <div>
        <div className="h-3 w-28 rounded bg-white/[0.06]" />
        <div className="mt-3 h-8 w-48 rounded-lg bg-white/[0.07]" />
        <div className="mt-3 h-4 w-72 rounded bg-white/[0.045]" />
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map(
          (_, index) => (
            <div
              key={index}
              className="h-36 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.03]"
            />
          ),
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="h-[32rem] rounded-[1.35rem] border border-white/[0.06] bg-white/[0.03]" />

        <div className="grid gap-4">
          <div className="h-64 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.03]" />
          <div className="h-64 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}
