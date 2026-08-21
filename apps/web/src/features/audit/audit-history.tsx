"use client";

import {
  ChevronLeft,
  ChevronRight,
  History,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { AuditEventCard } from "@/features/audit/audit-event-card";
import { AuditFilters } from "@/features/audit/audit-filters";
import { auditService } from "@/features/audit/audit-service";

import type {
  AuditEvent,
  AuditPageResponse,
  AuditSearchParams,
} from "@/types/audit";

const PAGE_SIZE = 10;

const initialFilters: AuditSearchParams = {
  page: 0,
  size: PAGE_SIZE,
  sort: "occurredAt,desc",
};

function getErrorMessage(
  exception: unknown,
): string {
  if (exception instanceof Error) {
    return exception.message;
  }

  return "Não foi possível carregar o histórico de atividades.";
}

function AuditHistoryLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map(
        (_, index) => (
          <div
            key={index}
            className={[
              "h-44 animate-pulse",
              "rounded-3xl border",
              "border-white/10",
              "bg-white/[0.025]",
            ].join(" ")}
          />
        ),
      )}
    </div>
  );
}

function EmptyAuditHistory() {
  return (
    <div
      className={[
        "flex min-h-64 flex-col",
        "items-center justify-center",
        "rounded-3xl border",
        "border-dashed border-white/10",
        "bg-white/[0.018]",
        "px-6 py-12 text-center",
      ].join(" ")}
    >
      <div
        className={[
          "flex size-14 items-center",
          "justify-center rounded-2xl",
          "border border-white/10",
          "bg-white/[0.04]",
          "text-zinc-600",
        ].join(" ")}
      >
        <History
          aria-hidden="true"
          className="size-6"
        />
      </div>

      <h3 className="mt-4 font-semibold text-white">
        Nenhuma atividade encontrada
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        Não existem eventos correspondentes aos filtros
        selecionados.
      </p>
    </div>
  );
}

export function AuditHistory() {
  const [filters, setFilters] =
    useState<AuditSearchParams>(
      initialFilters,
    );

  const [pageData, setPageData] =
    useState<
      AuditPageResponse<AuditEvent> | null
    >(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadEvents = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      }

      setError(null);

      try {
        const result =
          await auditService.search(filters);

        setPageData(result);
      } catch (exception) {
        setError(
          getErrorMessage(exception),
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [filters],
  );

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadEvents(false);
    } finally {
      setRefreshing(false);
    }
  }

  function handleFiltersChange(
    nextFilters: AuditSearchParams,
  ) {
    setFilters({
      ...nextFilters,
      size: PAGE_SIZE,
      sort: "occurredAt,desc",
    });
  }

  function handleClearFilters() {
    setFilters(initialFilters);
  }

  function changePage(
    page: number,
  ) {
    setFilters((current) => ({
      ...current,
      page,
    }));
  }

  const events = pageData?.content ?? [];
  const currentPage =
    pageData?.number ?? filters.page ?? 0;
  const totalPages =
    pageData?.totalPages ?? 0;

  return (
    <section className="space-y-4">
      <div
        className={[
          "relative overflow-hidden",
          "rounded-3xl border",
          "border-white/10",
          "bg-white/[0.025] p-5",
          "sm:p-6",
        ].join(" ")}
      >
        <div
          className={[
            "pointer-events-none absolute",
            "-right-10 -top-12",
            "size-40 rounded-full",
            "bg-white/[0.04] blur-3xl",
          ].join(" ")}
        />

        <div
          className={[
            "relative flex flex-col gap-4",
            "sm:flex-row sm:items-center",
            "sm:justify-between",
          ].join(" ")}
        >
          <div className="flex items-start gap-3">
            <div
              className={[
                "flex size-11 shrink-0",
                "items-center justify-center",
                "rounded-2xl border",
                "border-white/10",
                "bg-white/[0.04]",
                "text-zinc-300",
              ].join(" ")}
            >
              <History
                aria-hidden="true"
                className="size-5"
              />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                Histórico de atividades
              </h2>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Acompanhe alterações e operações realizadas
                pelos membros do núcleo.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={loading || refreshing}
            onClick={handleRefresh}
            className={[
              "inline-flex min-h-10",
              "w-fit items-center gap-2",
              "rounded-full border",
              "border-white/10",
              "bg-white/[0.035]",
              "px-4 py-2",
              "text-sm font-medium",
              "text-zinc-300 transition",
              "hover:border-white/20",
              "hover:bg-white/[0.07]",
              "hover:text-white",
              "disabled:cursor-not-allowed",
              "disabled:opacity-50",
            ].join(" ")}
          >
            <RefreshCw
              aria-hidden="true"
              className={[
                "size-4",
                refreshing
                  ? "animate-spin"
                  : "",
              ].join(" ")}
            />

            Atualizar
          </button>
        </div>

        {!loading && pageData && (
          <div className="relative mt-5 flex flex-wrap gap-2">
            <span
              className={[
                "rounded-full border",
                "border-white/10",
                "bg-black/20",
                "px-3 py-1.5",
                "text-xs text-zinc-500",
              ].join(" ")}
            >
              {pageData.totalElements.toLocaleString(
                "pt-BR",
              )}{" "}
              {pageData.totalElements === 1
                ? "atividade"
                : "atividades"}
            </span>
          </div>
        )}
      </div>

      <AuditFilters
        filters={filters}
        disabled={loading}
        onChange={handleFiltersChange}
        onClear={handleClearFilters}
      />

      {error && (
        <div
          role="alert"
          className={[
            "rounded-2xl border",
            "border-red-400/20",
            "bg-red-400/[0.07]",
            "px-4 py-3",
            "text-sm text-red-200",
          ].join(" ")}
        >
          {error}
        </div>
      )}

      {loading ? (
        <AuditHistoryLoading />
      ) : events.length === 0 ? (
        <EmptyAuditHistory />
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <AuditEventCard
              key={event.id}
              event={event}
            />
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <nav
          aria-label="Paginação das atividades"
          className={[
            "flex items-center",
            "justify-between gap-3",
            "rounded-2xl border",
            "border-white/10",
            "bg-white/[0.025] p-2",
          ].join(" ")}
        >
          <button
            type="button"
            disabled={pageData?.first ?? true}
            onClick={() =>
              changePage(
                Math.max(currentPage - 1, 0),
              )
            }
            className={[
              "inline-flex min-h-10",
              "items-center gap-2",
              "rounded-xl px-3 py-2",
              "text-sm font-medium",
              "text-zinc-400 transition",
              "hover:bg-white/[0.06]",
              "hover:text-white",
              "disabled:cursor-not-allowed",
              "disabled:opacity-30",
            ].join(" ")}
          >
            <ChevronLeft
              aria-hidden="true"
              className="size-4"
            />

            <span className="hidden sm:inline">
              Anterior
            </span>
          </button>

          <p className="text-xs text-zinc-500">
            Página{" "}
            <span className="font-medium text-zinc-300">
              {currentPage + 1}
            </span>{" "}
            de{" "}
            <span className="font-medium text-zinc-300">
              {Math.max(totalPages, 1)}
            </span>
          </p>

          <button
            type="button"
            disabled={pageData?.last ?? true}
            onClick={() =>
              changePage(currentPage + 1)
            }
            className={[
              "inline-flex min-h-10",
              "items-center gap-2",
              "rounded-xl px-3 py-2",
              "text-sm font-medium",
              "text-zinc-400 transition",
              "hover:bg-white/[0.06]",
              "hover:text-white",
              "disabled:cursor-not-allowed",
              "disabled:opacity-30",
            ].join(" ")}
          >
            <span className="hidden sm:inline">
              Próxima
            </span>

            <ChevronRight
              aria-hidden="true"
              className="size-4"
            />
          </button>
        </nav>
      )}

      {refreshing && (
        <div
          role="status"
          className={[
            "fixed bottom-24 right-5",
            "z-50 inline-flex",
            "items-center gap-2",
            "rounded-full border",
            "border-white/15",
            "bg-black/90 px-4 py-2.5",
            "text-xs text-zinc-300",
            "shadow-2xl backdrop-blur-xl",
            "lg:bottom-6",
          ].join(" ")}
        >
          <LoaderCircle
            aria-hidden="true"
            className="size-4 animate-spin"
          />

          Atualizando atividades
        </div>
      )}
    </section>
  );
}