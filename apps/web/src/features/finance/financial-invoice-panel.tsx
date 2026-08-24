"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  CreditCard,
  LoaderCircle,
  Lock,
  ReceiptText,
  RotateCcw,
  Trash2,
  Unlock,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  FinancialAccount,
  FinancialCreditCard,
  FinancialCreditCardInvoice,
  FinancialPaymentMethod,
} from "@/types/finance";

import { financeService } from "./finance-service";

interface FinancialInvoicePanelProps {
  card: FinancialCreditCard;
  accounts: FinancialAccount[];
  onChanged?: () => void;
  onClose: () => void;
}

const currencyFormatter =
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const paymentMethods: Array<{
  value: FinancialPaymentMethod;
  label: string;
}> = [
    {
      value: "PIX",
      label: "Pix",
    },
    {
      value: "BANK_TRANSFER",
      label: "Transferência",
    },
    {
      value: "DIRECT_DEBIT",
      label: "Débito automático",
    },
    {
      value: "CASH",
      label: "Dinheiro",
    },
    {
      value: "OTHER",
      label: "Outro",
    },
  ];

function todayAsInputValue() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(
      2,
      "0",
    ),
    String(today.getDate()).padStart(
      2,
      "0",
    ),
  ].join("-");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "pt-BR",
  ).format(
    new Date(`${value}T00:00:00`),
  );
}

function formatMonth(value: string) {
  const formatted = new Intl.DateTimeFormat(
    "pt-BR",
    {
      month: "long",
      year: "numeric",
    },
  ).format(
    new Date(`${value}T00:00:00`),
  );

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function monthKey(value: string) {
  return value.slice(0, 7);
}

function currentMonthKey() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function orderInvoices(invoices: FinancialCreditCardInvoice[]) {
  const current = currentMonthKey();

  return [...invoices].sort((left, right) => {
    const leftKey = monthKey(left.referenceMonth);
    const rightKey = monthKey(right.referenceMonth);

    if (leftKey === current) return -1;
    if (rightKey === current) return 1;

    const leftIsFuture = leftKey > current;
    const rightIsFuture = rightKey > current;

    if (leftIsFuture !== rightIsFuture) {
      return leftIsFuture ? -1 : 1;
    }

    return leftIsFuture
      ? leftKey.localeCompare(rightKey)
      : rightKey.localeCompare(leftKey);
  });
}

function invoiceStatusDetails(
  invoice: FinancialCreditCardInvoice,
) {
  const overdue =
    invoice.status === "CLOSED" &&
    invoice.dueDate <
    todayAsInputValue();

  if (overdue) {
    return {
      label: "Vencida",
      className:
        "border-red-400/20 bg-red-400/10 text-red-300",
    };
  }

  switch (invoice.status) {
    case "OPEN":
      return {
        label: "Aberta",
        className:
          "border-amber-400/20 bg-amber-400/10 text-amber-300",
      };

    case "CLOSED":
      return {
        label: "Fechada",
        className:
          "border-blue-400/20 bg-blue-400/10 text-blue-300",
      };

    case "PAID":
      return {
        label: "Paga",
        className:
          "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      };

    case "CANCELLED":
      return {
        label: "Cancelada",
        className:
          "border-white/10 bg-white/[0.04] text-zinc-500",
      };
  }
}

export function FinancialInvoicePanel({
  card,
  accounts,
  onChanged,
  onClose,
}: FinancialInvoicePanelProps) {
  const [invoices, setInvoices] =
    useState<
      FinancialCreditCardInvoice[]
    >([]);

  const [
    expandedInvoiceId,
    setExpandedInvoiceId,
  ] = useState<string | null>(null);

  const [
    paymentInvoice,
    setPaymentInvoice,
  ] =
    useState<FinancialCreditCardInvoice | null>(
      null,
    );

  const [
    deleteConfirmationId,
    setDeleteConfirmationId,
  ] = useState<string | null>(null);

  const [accountId, setAccountId] =
    useState(
      card.paymentAccountId ?? "",
    );

  const [paymentDate, setPaymentDate] =
    useState(todayAsInputValue());

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<FinancialPaymentMethod>(
      "PIX",
    );

  const [loading, setLoading] =
    useState(true);

  const [actionId, setActionId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const loadInvoices =
    useCallback(async () => {
      try {
        const response =
          await financeService.invoices.list(
            card.id,
          );

        const ordered = orderInvoices(response);
        setInvoices(ordered);
        setError(null);

        setExpandedInvoiceId(
          (current) =>
            current ??
            ordered[0]?.id ??
            null,
        );
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar as faturas.",
        );
      } finally {
        setLoading(false);
      }
    }, [card.id]);

  useEffect(() => {
    let active = true;

    financeService.invoices
      .list(card.id)
      .then((response) => {
        if (!active) {
          return;
        }

        const ordered = orderInvoices(response);
        setInvoices(ordered);
        setError(null);

        setExpandedInvoiceId(
          (current) =>
            current ??
            ordered[0]?.id ??
            null,
        );
      })
      .catch((requestError: unknown) => {
        if (!active) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar as faturas.",
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [card.id]);

  const summary = useMemo(() => {
    return invoices.reduce(
      (totals, invoice) => {
        if (
          invoice.status === "OPEN" ||
          invoice.status === "CLOSED"
        ) {
          totals.outstanding +=
            invoice.totalAmount;
        }

        if (invoice.status === "PAID") {
          totals.paid +=
            invoice.totalAmount;
        }

        totals.installments +=
          invoice.installments.filter(
            (installment) =>
              installment.status ===
              "OPEN",
          ).length;

        return totals;
      },
      {
        outstanding: 0,
        paid: 0,
        installments: 0,
      },
    );
  }, [invoices]);

  async function executeAction(
    invoiceId: string,
    action: () => Promise<unknown>,
  ) {
    setActionId(invoiceId);
    setError(null);

    try {
      await action();
      await loadInvoices();
      onChanged?.();

      return true;
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível realizar a ação.",
      );

      return false;
    } finally {
      setActionId(null);
    }
  }

  async function submitPayment(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);

    if (!paymentInvoice) {
      return;
    }

    if (!accountId) {
      setError(
        "Selecione a conta usada para pagar a fatura.",
      );
      return;
    }

    if (!paymentDate) {
      setError(
        "Informe a data do pagamento.",
      );
      return;
    }

    const succeeded =
      await executeAction(
        paymentInvoice.id,
        () =>
          financeService.invoices.pay(
            paymentInvoice.id,
            {
              accountId,
              paymentDate,
              paymentMethod,
            },
          ),
      );

    if (succeeded) {
      setPaymentInvoice(null);
    }
  }

  async function deleteInvoice(
    invoiceId: string,
  ) {
    const succeeded =
      await executeAction(
        invoiceId,
        () =>
          financeService.invoices.remove(
            invoiceId,
          ),
      );

    if (succeeded) {
      setDeleteConfirmationId(null);
    }
  }

  function retryLoad() {
    setLoading(true);
    setError(null);
    void loadInvoices();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-panel-title"
        className="h-full w-full overflow-y-auto border-l border-white/10 bg-[#090909] shadow-2xl sm:max-w-[760px] xl:max-w-[840px]"
      >
        <header className="sticky top-0 z-20 flex items-start justify-between border-b border-white/10 bg-[#090909]/95 p-5 backdrop-blur-xl sm:px-7">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Faturas
            </p>

            <h2
              id="invoice-panel-title"
              className="mt-1 text-xl font-semibold text-white"
            >
              {card.name} ••••{" "}
              {card.lastFour}
            </h2>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fechar faturas"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </header>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-wider text-zinc-600">
                Em aberto
              </p>

              <p className="mt-2 text-lg font-semibold text-white">
                {currencyFormatter.format(
                  summary.outstanding,
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-wider text-zinc-600">
                Já pago
              </p>

              <p className="mt-2 text-lg font-semibold text-emerald-300">
                {currencyFormatter.format(
                  summary.paid,
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-wider text-zinc-600">
                Parcelas
              </p>

              <p className="mt-2 text-lg font-semibold text-white">
                {summary.installments}
              </p>
            </div>
          </div>

          {error ? (
            <div
              role="alert"
              className="flex gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-4 text-sm leading-6 text-red-200"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex min-h-60 items-center justify-center">
              <LoaderCircle className="size-6 animate-spin text-zinc-500" />
            </div>
          ) : null}

          {!loading &&
            error &&
            invoices.length === 0 ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="secondary"
                onClick={retryLoad}
              >
                Tentar novamente
              </Button>
            </div>
          ) : null}

          {!loading &&
            !error &&
            invoices.length === 0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 p-8 text-center">
              <ReceiptText className="size-8 text-zinc-600" />

              <p className="mt-4 font-medium text-zinc-300">
                Nenhuma fatura encontrada
              </p>

              <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                As faturas serão criadas
                automaticamente quando uma compra
                for registrada neste cartão.
              </p>
            </div>
          ) : null}

          {!loading
            ? invoices.map((invoice) => {
              const status =
                invoiceStatusDetails(
                  invoice,
                );

              const expanded =
                expandedInvoiceId ===
                invoice.id;

              const processing =
                actionId === invoice.id;

              const isCurrent =
                monthKey(invoice.referenceMonth) === currentMonthKey();

              const canDelete =
                invoice.installments.length ===
                0;

              return (
                <article
                  key={invoice.id}
                  className={[
                    "overflow-hidden rounded-[1.5rem] border bg-white/[0.03] transition",
                    isCurrent
                      ? "border-white/20 ring-1 ring-white/[0.04]"
                      : "border-white/10",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    aria-expanded={expanded}
                    className="flex w-full items-start justify-between gap-4 p-4 text-left transition hover:bg-white/[0.025] sm:p-5"
                    onClick={() =>
                      setExpandedInvoiceId(
                        expanded
                          ? null
                          : invoice.id,
                      )
                    }
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">
                          {formatMonth(invoice.referenceMonth)}
                        </p>

                        {isCurrent ? (
                          <span className="rounded-lg border border-white/10 bg-white/[0.07] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                            Fatura atual
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-xs text-zinc-500">
                        Fecha em{" "}
                        {formatDate(
                          invoice.closingDate,
                        )}
                        {" • "}
                        Vence em{" "}
                        {formatDate(
                          invoice.dueDate,
                        )}
                      </p>

                      <p className="mt-3 text-xl font-semibold text-white sm:text-2xl">
                        {currencyFormatter.format(
                          invoice.totalAmount,
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={[
                          "rounded-xl border px-3 py-1.5 text-xs font-medium",
                          status.className,
                        ].join(" ")}
                      >
                        {status.label}
                      </span>

                      <ChevronDown
                        className={[
                          "size-4 text-zinc-500 transition-transform",
                          expanded
                            ? "rotate-180"
                            : "",
                        ].join(" ")}
                      />
                    </div>
                  </button>

                  {expanded ? (
                    <div className="border-t border-white/[0.06]">
                      <div className="space-y-2 p-4 sm:p-5">
                        {invoice.installments.length ===
                          0 ? (
                          <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-zinc-500">
                            Esta fatura não possui
                            lançamentos.
                          </div>
                        ) : (
                          invoice.installments.map(
                            (installment) => (
                              <div
                                key={
                                  installment.id
                                }
                                className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-black/20 p-4"
                              >
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.055] text-zinc-400">
                                  <CreditCard className="size-4" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-zinc-200">
                                    {
                                      installment.purchaseDescription
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-zinc-500">
                                    Parcela{" "}
                                    {
                                      installment.installmentNumber
                                    }
                                    /
                                    {
                                      installment.totalInstallments
                                    }
                                    {" • "}
                                    {installment.categoryName ??
                                      "Sem categoria"}
                                  </p>
                                </div>

                                <div className="shrink-0 text-right">
                                  <p className="text-sm font-semibold text-white">
                                    {currencyFormatter.format(
                                      installment.amount,
                                    )}
                                  </p>

                                  <p
                                    className={[
                                      "mt-1 text-xs",
                                      installment.status ===
                                        "CANCELLED"
                                        ? "text-zinc-600"
                                        : installment.paid
                                          ? "text-emerald-400"
                                          : "text-zinc-500",
                                    ].join(" ")}
                                  >
                                    {installment.status ===
                                      "CANCELLED"
                                      ? "Cancelada"
                                      : installment.paid
                                        ? "Paga"
                                        : "Em aberto"}
                                  </p>
                                </div>
                              </div>
                            ),
                          )
                        )}
                      </div>

                      <div className="border-t border-white/[0.06] p-4 sm:p-5">
                        {deleteConfirmationId ===
                          invoice.id ? (
                          <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4">
                            <p className="text-sm leading-6 text-zinc-300">
                              Deseja excluir esta
                              fatura vazia?
                            </p>

                            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={
                                  processing
                                }
                                onClick={() =>
                                  setDeleteConfirmationId(
                                    null,
                                  )
                                }
                              >
                                Voltar
                              </Button>

                              <Button
                                type="button"
                                variant="danger"
                                loading={
                                  processing
                                }
                                onClick={() =>
                                  void deleteInvoice(
                                    invoice.id,
                                  )
                                }
                              >
                                Excluir fatura
                              </Button>
                            </div>
                          </div>
                        ) : processing ? (
                          <div className="flex h-10 items-center">
                            <LoaderCircle className="size-5 animate-spin text-zinc-500" />
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {invoice.status ===
                              "OPEN" ? (
                              <Button
                                type="button"
                                variant="secondary"
                                size="small"
                                onClick={() =>
                                  void executeAction(
                                    invoice.id,
                                    () =>
                                      financeService.invoices.close(
                                        invoice.id,
                                      ),
                                  )
                                }
                              >
                                <Lock className="size-3.5" />
                                Fechar fatura
                              </Button>
                            ) : null}

                            {invoice.status ===
                              "CLOSED" ? (
                              <>
                                <Button
                                  type="button"
                                  size="small"
                                  onClick={() => {
                                    setAccountId(
                                      card.paymentAccountId ??
                                      "",
                                    );

                                    setPaymentDate(
                                      todayAsInputValue(),
                                    );

                                    setPaymentInvoice(
                                      invoice,
                                    );
                                  }}
                                >
                                  <Check className="size-3.5" />
                                  Pagar
                                </Button>

                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="small"
                                  onClick={() =>
                                    void executeAction(
                                      invoice.id,
                                      () =>
                                        financeService.invoices.reopen(
                                          invoice.id,
                                        ),
                                    )
                                  }
                                >
                                  <Unlock className="size-3.5" />
                                  Reabrir
                                </Button>
                              </>
                            ) : null}

                            {invoice.status ===
                              "PAID" ? (
                              <Button
                                type="button"
                                variant="secondary"
                                size="small"
                                onClick={() =>
                                  void executeAction(
                                    invoice.id,
                                    () =>
                                      financeService.invoices.reversePayment(
                                        invoice.id,
                                      ),
                                  )
                                }
                              >
                                <RotateCcw className="size-3.5" />
                                Estornar pagamento
                              </Button>
                            ) : null}

                            {canDelete ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="small"
                                className="text-red-300"
                                onClick={() =>
                                  setDeleteConfirmationId(
                                    invoice.id,
                                  )
                                }
                              >
                                <Trash2 className="size-3.5" />
                                Excluir
                              </Button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })
            : null}
        </div>
      </section>

      {paymentInvoice ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/80 sm:items-center sm:p-6">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-payment-title"
            onSubmit={submitPayment}
            className="w-full space-y-5 rounded-t-[2rem] border border-white/10 bg-[#101010] p-6 shadow-2xl sm:max-w-md sm:rounded-[2rem]"
          >
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-600">
                Pagamento integral
              </p>

              <h3
                id="invoice-payment-title"
                className="mt-1 text-lg font-semibold text-white"
              >
                Pagar fatura de{" "}
                {formatMonth(
                  paymentInvoice.referenceMonth,
                )}
              </h3>

              <p className="mt-2 text-2xl font-semibold text-white">
                {currencyFormatter.format(
                  paymentInvoice.totalAmount,
                )}
              </p>
            </div>

            <div>
              <label
                htmlFor="invoice-payment-account"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Conta de pagamento
              </label>

              <select
                id="invoice-payment-account"
                value={accountId}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition focus:border-white/30"
                onChange={(event) =>
                  setAccountId(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Selecione a conta
                </option>

                {accounts
                  .filter(
                    (account) =>
                      account.active ||
                      account.id ===
                      accountId,
                  )
                  .map((account) => (
                    <option
                      key={account.id}
                      value={account.id}
                    >
                      {account.name}
                    </option>
                  ))}
              </select>
            </div>

            <Input
              id="invoice-payment-date"
              label="Data do pagamento"
              type="date"
              value={paymentDate}
              onChange={(event) =>
                setPaymentDate(
                  event.target.value,
                )
              }
            />

            <div>
              <label
                htmlFor="invoice-payment-method"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Forma de pagamento
              </label>

              <select
                id="invoice-payment-method"
                value={paymentMethod}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition focus:border-white/30"
                onChange={(event) => {
                  const value =
                    event.target.value;

                  const validMethod =
                    paymentMethods.find(
                      (method) =>
                        method.value === value,
                    );

                  if (validMethod) {
                    setPaymentMethod(
                      validMethod.value,
                    );
                  }
                }}
              >
                {paymentMethods.map(
                  (method) => (
                    <option
                      key={method.value}
                      value={method.value}
                    >
                      {method.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                disabled={
                  actionId ===
                  paymentInvoice.id
                }
                onClick={() =>
                  setPaymentInvoice(null)
                }
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                loading={
                  actionId ===
                  paymentInvoice.id
                }
              >
                Confirmar pagamento
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}