"use client";

import {
  CalendarRange,
  Filter,
  RotateCcw,
} from "lucide-react";

import type {
  AuditAction,
  AuditResourceType,
  AuditSearchParams,
} from "@/types/audit";

interface AuditFiltersProps {
  filters: AuditSearchParams;
  disabled?: boolean;
  onChange: (
    filters: AuditSearchParams,
  ) => void;
  onClear: () => void;
}

const actionOptions: Array<{
  value: AuditAction;
  label: string;
}> = [
  { value: "CREATE", label: "Criação" },
  { value: "UPDATE", label: "Atualização" },
  { value: "DELETE", label: "Exclusão" },
  { value: "ACTIVATE", label: "Ativação" },
  { value: "DEACTIVATE", label: "Desativação" },
  { value: "COMPLETE", label: "Conclusão" },
  { value: "CLOSE", label: "Fechamento" },
  { value: "REOPEN", label: "Reabertura" },
  { value: "CANCEL", label: "Cancelamento" },
  { value: "RESTORE", label: "Restauração" },
  {
    value: "MARK_AS_PAID",
    label: "Marcação como pago",
  },
  {
    value: "MARK_AS_PENDING",
    label: "Marcação como pendente",
  },
  {
    value: "REVERSE_PAYMENT",
    label: "Estorno de pagamento",
  },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  {
    value: "REFRESH_TOKEN",
    label: "Renovação da sessão",
  },
  { value: "INVITE", label: "Convite" },
  {
    value: "ACCEPT_INVITATION",
    label: "Aceite de convite",
  },
  {
    value: "DECLINE_INVITATION",
    label: "Recusa de convite",
  },
  {
    value: "REVOKE_INVITATION",
    label: "Revogação de convite",
  },
  {
    value: "CHANGE_ROLE",
    label: "Alteração de função",
  },
  {
    value: "MARK_AS_READ",
    label: "Marcação como lida",
  },
  {
    value: "MARK_AS_UNREAD",
    label: "Marcação como não lida",
  },
  {
    value: "MARK_ALL_AS_READ",
    label: "Leitura de todas",
  },
  {
    value: "SYSTEM_GENERATION",
    label: "Geração automática",
  },
];

const resourceOptions: Array<{
  value: AuditResourceType;
  label: string;
}> = [
  { value: "USER", label: "Usuário" },
  { value: "FAMILY", label: "Núcleo familiar" },
  {
    value: "FAMILY_MEMBERSHIP",
    label: "Membro da família",
  },
  {
    value: "FAMILY_INVITATION",
    label: "Convite familiar",
  },
  {
    value: "AGENDA_EVENT",
    label: "Evento da agenda",
  },
  {
    value: "AGENDA_OCCURRENCE",
    label: "Ocorrência da agenda",
  },
  {
    value: "SHOPPING_LIST",
    label: "Lista de compras",
  },
  {
    value: "SHOPPING_ITEM",
    label: "Item de compra",
  },
  {
    value: "FINANCIAL_ACCOUNT",
    label: "Conta financeira",
  },
  {
    value: "FINANCIAL_CATEGORY",
    label: "Categoria financeira",
  },
  {
    value: "FINANCIAL_TRANSACTION",
    label: "Transação financeira",
  },
  {
    value: "FINANCIAL_RECURRENCE",
    label: "Recorrência financeira",
  },
  {
    value: "FINANCIAL_BUDGET",
    label: "Orçamento",
  },
  {
    value: "FINANCIAL_CREDIT_CARD",
    label: "Cartão de crédito",
  },
  {
    value: "FINANCIAL_CREDIT_CARD_PURCHASE",
    label: "Compra no cartão",
  },
  {
    value: "FINANCIAL_CREDIT_CARD_INVOICE",
    label: "Fatura do cartão",
  },
  {
    value: "NOTIFICATION",
    label: "Notificação",
  },
  {
    value: "NOTIFICATION_PREFERENCE",
    label: "Preferência de notificação",
  },
  {
    value: "SYSTEM",
    label: "Sistema",
  },
];

function dateInputValue(
  value: string | undefined,
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function startOfDayIso(
  value: string,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(
    `${value}T00:00:00`,
  ).toISOString();
}

function endOfDayIso(
  value: string,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(
    `${value}T23:59:59.999`,
  ).toISOString();
}

export function AuditFilters({
  filters,
  disabled = false,
  onChange,
  onClear,
}: AuditFiltersProps) {
  const hasFilters = Boolean(
    filters.action ||
      filters.resourceType ||
      filters.from ||
      filters.to,
  );

  return (
    <section
      className={[
        "rounded-3xl border",
        "border-white/10",
        "bg-white/[0.025] p-4",
        "sm:p-5",
      ].join(" ")}
    >
      <div
        className={[
          "flex flex-col gap-3",
          "sm:flex-row sm:items-center",
          "sm:justify-between",
        ].join(" ")}
      >
        <div className="flex items-center gap-2">
          <Filter
            aria-hidden="true"
            className="size-4 text-zinc-500"
          />

          <h3 className="text-sm font-semibold text-zinc-300">
            Filtrar atividades
          </h3>
        </div>

        <button
          type="button"
          disabled={disabled || !hasFilters}
          onClick={onClear}
          className={[
            "inline-flex min-h-9",
            "w-fit items-center gap-2",
            "rounded-full border",
            "border-white/10",
            "bg-white/[0.025]",
            "px-3 py-2",
            "text-xs font-medium",
            "text-zinc-500 transition",
            "hover:border-white/20",
            "hover:text-white",
            "disabled:cursor-not-allowed",
            "disabled:opacity-30",
          ].join(" ")}
        >
          <RotateCcw
            aria-hidden="true"
            className="size-3.5"
          />

          Limpar filtros
        </button>
      </div>

      <fieldset
        disabled={disabled}
        className={[
          "mt-4 grid gap-3",
          "sm:grid-cols-2",
          "xl:grid-cols-4",
        ].join(" ")}
      >
        <div>
          <label
            htmlFor="audit-action"
            className="text-xs font-medium text-zinc-500"
          >
            Ação
          </label>

          <select
            id="audit-action"
            value={filters.action ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                action:
                  (event.target.value as AuditAction) ||
                  undefined,
                page: 0,
              })
            }
            className={[
              "mt-2 min-h-11 w-full",
              "rounded-xl border",
              "border-white/10",
              "bg-black px-3 py-2.5",
              "text-sm text-zinc-300",
              "outline-none transition",
              "focus:border-white/30",
            ].join(" ")}
          >
            <option value="">
              Todas as ações
            </option>

            {actionOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="audit-resource"
            className="text-xs font-medium text-zinc-500"
          >
            Recurso
          </label>

          <select
            id="audit-resource"
            value={
              filters.resourceType ?? ""
            }
            onChange={(event) =>
              onChange({
                ...filters,
                resourceType:
                  (event.target
                    .value as AuditResourceType) ||
                  undefined,
                page: 0,
              })
            }
            className={[
              "mt-2 min-h-11 w-full",
              "rounded-xl border",
              "border-white/10",
              "bg-black px-3 py-2.5",
              "text-sm text-zinc-300",
              "outline-none transition",
              "focus:border-white/30",
            ].join(" ")}
          >
            <option value="">
              Todos os recursos
            </option>

            {resourceOptions.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="audit-from"
            className="text-xs font-medium text-zinc-500"
          >
            Data inicial
          </label>

          <div className="relative mt-2">
            <CalendarRange
              aria-hidden="true"
              className={[
                "pointer-events-none",
                "absolute left-3 top-1/2",
                "size-4 -translate-y-1/2",
                "text-zinc-600",
              ].join(" ")}
            />

            <input
              id="audit-from"
              type="date"
              value={dateInputValue(
                filters.from,
              )}
              max={dateInputValue(
                filters.to,
              )}
              onChange={(event) =>
                onChange({
                  ...filters,
                  from: startOfDayIso(
                    event.target.value,
                  ),
                  page: 0,
                })
              }
              className={[
                "min-h-11 w-full",
                "rounded-xl border",
                "border-white/10",
                "bg-black py-2.5",
                "pl-10 pr-3",
                "text-sm text-zinc-300",
                "outline-none transition",
                "focus:border-white/30",
                "[color-scheme:dark]",
              ].join(" ")}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="audit-to"
            className="text-xs font-medium text-zinc-500"
          >
            Data final
          </label>

          <div className="relative mt-2">
            <CalendarRange
              aria-hidden="true"
              className={[
                "pointer-events-none",
                "absolute left-3 top-1/2",
                "size-4 -translate-y-1/2",
                "text-zinc-600",
              ].join(" ")}
            />

            <input
              id="audit-to"
              type="date"
              value={dateInputValue(
                filters.to,
              )}
              min={dateInputValue(
                filters.from,
              )}
              onChange={(event) =>
                onChange({
                  ...filters,
                  to: endOfDayIso(
                    event.target.value,
                  ),
                  page: 0,
                })
              }
              className={[
                "min-h-11 w-full",
                "rounded-xl border",
                "border-white/10",
                "bg-black py-2.5",
                "pl-10 pr-3",
                "text-sm text-zinc-300",
                "outline-none transition",
                "focus:border-white/30",
                "[color-scheme:dark]",
              ].join(" ")}
            />
          </div>
        </div>
      </fieldset>
    </section>
  );
}