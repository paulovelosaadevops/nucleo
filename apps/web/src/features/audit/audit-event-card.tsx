import {
  Bell,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Cpu,
  Globe2,
  House,
  ShoppingBasket,
  UserRound,
} from "lucide-react";

import type {
  AuditAction,
  AuditEvent,
  AuditResourceType,
} from "@/types/audit";

interface AuditEventCardProps {
  event: AuditEvent;
}

const dateFormatter = new Intl.DateTimeFormat(
  "pt-BR",
  {
    dateStyle: "medium",
    timeStyle: "medium",
  },
);

const actionLabels: Record<
  AuditAction,
  string
> = {
  CREATE: "Criou",
  UPDATE: "Atualizou",
  DELETE: "Excluiu",
  ACTIVATE: "Ativou",
  DEACTIVATE: "Desativou",
  COMPLETE: "Concluiu",
  CLOSE: "Fechou",
  REOPEN: "Reabriu",
  CANCEL: "Cancelou",
  RESTORE: "Restaurou",
  MARK_AS_PAID: "Marcou como pago",
  MARK_AS_PENDING: "Marcou como pendente",
  REVERSE_PAYMENT: "Estornou pagamento",
  LOGIN: "Entrou no sistema",
  LOGOUT: "Saiu do sistema",
  REFRESH_TOKEN: "Renovou a sessão",
  INVITE: "Enviou convite",
  ACCEPT_INVITATION: "Aceitou convite",
  DECLINE_INVITATION: "Recusou convite",
  REVOKE_INVITATION: "Revogou convite",
  CHANGE_ROLE: "Alterou função",
  MARK_AS_READ: "Marcou como lida",
  MARK_AS_UNREAD: "Marcou como não lida",
  MARK_ALL_AS_READ: "Marcou todas como lidas",
  SYSTEM_GENERATION: "Gerou automaticamente",
};

const resourceLabels: Record<
  AuditResourceType,
  string
> = {
  USER: "Usuário",
  FAMILY: "Núcleo familiar",
  FAMILY_MEMBERSHIP: "Membro da família",
  FAMILY_INVITATION: "Convite familiar",
  AGENDA_EVENT: "Evento da agenda",
  AGENDA_OCCURRENCE: "Ocorrência da agenda",
  SHOPPING_LIST: "Lista de compras",
  SHOPPING_ITEM: "Item de compra",
  FINANCIAL_ACCOUNT: "Conta financeira",
  FINANCIAL_CATEGORY: "Categoria financeira",
  FINANCIAL_TRANSACTION: "Transação financeira",
  FINANCIAL_RECURRENCE: "Recorrência financeira",
  FINANCIAL_BUDGET: "Orçamento",
  FINANCIAL_CREDIT_CARD: "Cartão de crédito",
  FINANCIAL_CREDIT_CARD_PURCHASE:
    "Compra no cartão",
  FINANCIAL_CREDIT_CARD_INVOICE:
    "Fatura do cartão",
  NOTIFICATION: "Notificação",
  NOTIFICATION_PREFERENCE:
    "Preferência de notificação",
  SYSTEM: "Sistema",
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return dateFormatter.format(date);
}

function formatMetadata(
  metadataJson: string,
): string {
  try {
    const parsed = JSON.parse(
      metadataJson,
    );

    return JSON.stringify(
      parsed,
      null,
      2,
    );
  } catch {
    return metadataJson;
  }
}

function resourceIcon(
  resourceType: AuditResourceType,
) {
  if (
    resourceType === "USER" ||
    resourceType ===
      "FAMILY_MEMBERSHIP"
  ) {
    return (
      <UserRound
        aria-hidden="true"
        className="size-5"
      />
    );
  }

  if (
    resourceType === "FAMILY" ||
    resourceType ===
      "FAMILY_INVITATION"
  ) {
    return (
      <House
        aria-hidden="true"
        className="size-5"
      />
    );
  }

  if (
    resourceType === "AGENDA_EVENT" ||
    resourceType ===
      "AGENDA_OCCURRENCE"
  ) {
    return (
      <CalendarDays
        aria-hidden="true"
        className="size-5"
      />
    );
  }

  if (
    resourceType === "SHOPPING_LIST" ||
    resourceType === "SHOPPING_ITEM"
  ) {
    return (
      <ShoppingBasket
        aria-hidden="true"
        className="size-5"
      />
    );
  }

  if (
    resourceType.startsWith(
      "FINANCIAL_",
    )
  ) {
    return (
      <CircleDollarSign
        aria-hidden="true"
        className="size-5"
      />
    );
  }

  if (
    resourceType === "NOTIFICATION" ||
    resourceType ===
      "NOTIFICATION_PREFERENCE"
  ) {
    return (
      <Bell
        aria-hidden="true"
        className="size-5"
      />
    );
  }

  return (
    <Cpu
      aria-hidden="true"
      className="size-5"
    />
  );
}

export function AuditEventCard({
  event,
}: AuditEventCardProps) {
  const actor =
    event.actorName ??
    event.actorEmail ??
    "Sistema";

  return (
    <article
      className={[
        "rounded-3xl border",
        "border-white/10",
        "bg-white/[0.025] p-4",
        "transition",
        "hover:border-white/15",
        "hover:bg-white/[0.04]",
        "sm:p-5",
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
            "text-zinc-400",
          ].join(" ")}
        >
          {resourceIcon(
            event.resourceType,
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={[
              "flex flex-col gap-2",
              "sm:flex-row",
              "sm:items-start",
              "sm:justify-between",
            ].join(" ")}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "rounded-full border",
                    "border-white/10",
                    "bg-white/[0.035]",
                    "px-2.5 py-1",
                    "text-[0.65rem]",
                    "font-semibold uppercase",
                    "tracking-[0.13em]",
                    "text-zinc-400",
                  ].join(" ")}
                >
                  {actionLabels[event.action]}
                </span>

                <span className="text-xs text-zinc-600">
                  {
                    resourceLabels[
                      event.resourceType
                    ]
                  }
                </span>
              </div>

              <h3 className="mt-3 text-sm font-semibold leading-6 text-white">
                {event.description}
              </h3>

              <p className="mt-1 text-xs text-zinc-500">
                Realizado por{" "}
                <span className="font-medium text-zinc-300">
                  {actor}
                </span>
              </p>
            </div>

            <time
              dateTime={event.occurredAt}
              className={[
                "shrink-0 text-xs",
                "text-zinc-600",
              ].join(" ")}
            >
              {formatDate(event.occurredAt)}
            </time>
          </div>

          {(event.ipAddress ||
            event.resourceId) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {event.ipAddress && (
                <span
                  className={[
                    "inline-flex items-center",
                    "gap-1.5 rounded-full",
                    "border border-white/[0.07]",
                    "bg-black/20 px-2.5 py-1",
                    "text-[0.68rem]",
                    "text-zinc-600",
                  ].join(" ")}
                >
                  <Globe2
                    aria-hidden="true"
                    className="size-3"
                  />

                  {event.ipAddress}
                </span>
              )}

              {event.resourceId && (
                <span
                  title={event.resourceId}
                  className={[
                    "max-w-full truncate",
                    "rounded-full border",
                    "border-white/[0.07]",
                    "bg-black/20 px-2.5 py-1",
                    "text-[0.68rem]",
                    "text-zinc-600",
                  ].join(" ")}
                >
                  ID: {event.resourceId}
                </span>
              )}
            </div>
          )}

          {event.metadataJson && (
            <details
              className={[
                "group mt-4 overflow-hidden",
                "rounded-2xl border",
                "border-white/[0.07]",
                "bg-black/20",
              ].join(" ")}
            >
              <summary
                className={[
                  "flex cursor-pointer",
                  "list-none items-center",
                  "justify-between gap-3",
                  "px-4 py-3",
                  "text-xs font-medium",
                  "text-zinc-500 transition",
                  "hover:text-zinc-300",
                ].join(" ")}
              >
                Dados técnicos

                <ChevronDown
                  aria-hidden="true"
                  className={[
                    "size-4 transition",
                    "group-open:rotate-180",
                  ].join(" ")}
                />
              </summary>

              <pre
                className={[
                  "max-h-72 overflow-auto",
                  "border-t border-white/[0.06]",
                  "px-4 py-3",
                  "text-[0.7rem]",
                  "leading-5 text-zinc-500",
                ].join(" ")}
              >
                {formatMetadata(
                  event.metadataJson,
                )}
              </pre>
            </details>
          )}
        </div>
      </div>
    </article>
  );
}