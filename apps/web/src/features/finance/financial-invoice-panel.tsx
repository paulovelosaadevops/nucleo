"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  LoaderCircle,
  Lock,
  RotateCcw,
  Trash2,
  Unlock,
  X,
} from "lucide-react";

import { financeService } from "./finance-service";

import type {
  FinancialAccount,
  FinancialCreditCard,
  FinancialCreditCardInvoice,
  FinancialPaymentMethod,
} from "@/types/finance";

interface FinancialInvoicePanelProps {
  card: FinancialCreditCard;
  accounts: FinancialAccount[];
  onChanged?: () => void;
  onClose: () => void;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const paymentMethods: Array<{
  value: FinancialPaymentMethod;
  label: string;
}> = [
  { value: "PIX", label: "Pix" },
  { value: "BANK_TRANSFER", label: "Transferência" },
  { value: "DIRECT_DEBIT", label: "Débito automático" },
  { value: "CASH", label: "Dinheiro" },
  { value: "OTHER", label: "Outro" },
];

function todayAsInputValue() {
  return new Date().toLocaleDateString("en-CA");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(`${value}T00:00:00`),
  );
}

export function FinancialInvoicePanel({
  card,
  accounts,
  onChanged,
  onClose,
}: FinancialInvoicePanelProps) {
  const [invoices, setInvoices] = useState<
    FinancialCreditCardInvoice[]
  >([]);
  const [paymentInvoice, setPaymentInvoice] =
    useState<FinancialCreditCardInvoice | null>(null);
  const [accountId, setAccountId] = useState(
    card.paymentAccountId,
  );
  const [paymentDate, setPaymentDate] = useState(
    todayAsInputValue(),
  );
  const [paymentMethod, setPaymentMethod] =
    useState<FinancialPaymentMethod>("PIX");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setInvoices(await financeService.invoices.list(card.id));
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
    void loadInvoices();
  }, [loadInvoices]);

  async function executeAction(
    invoiceId: string,
    action: () => Promise<FinancialCreditCardInvoice | void>,
  ) {
    setActionId(invoiceId);
    setError(null);

    try {
      await action();
      await loadInvoices();
      onChanged?.();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível realizar a ação.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!paymentInvoice || !accountId) {
      return;
    }

    await executeAction(paymentInvoice.id, () =>
      financeService.invoices.pay(paymentInvoice.id, {
        accountId,
        paymentDate,
        paymentMethod,
      }),
    );

    setPaymentInvoice(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
      <section className="h-full w-full overflow-y-auto border-l border-white/10 bg-[#090909] sm:max-w-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-white/10 bg-[#090909]/95 p-5 backdrop-blur-xl sm:px-7">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Faturas
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {card.name} •••• {card.lastFour}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="space-y-4 p-5 sm:p-7">
          {error ? (
            <div className="flex gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-4 text-sm text-rose-200">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex min-h-60 items-center justify-center">
              <LoaderCircle className="size-6 animate-spin text-zinc-500" />
            </div>
          ) : null}

          {!loading && invoices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">
              Nenhuma fatura encontrada para este cartão.
            </div>
          ) : null}

          {invoices.map((invoice) => (
            <article
              key={invoice.id}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold capitalize text-white">
                    {new Intl.DateTimeFormat("pt-BR", {
                      month: "long",
                      year: "numeric",
                    }).format(
                      new Date(
                        `${invoice.referenceMonth}T00:00:00`,
                      ),
                    )}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Vence em {formatDate(invoice.dueDate)}
                  </p>
                </div>

                <span className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-zinc-400">
                  {invoice.status}
                </span>
              </div>

              <p className="mt-5 text-2xl font-semibold text-white">
                {currencyFormatter.format(invoice.totalAmount)}
              </p>

              <p className="mt-2 text-xs text-zinc-600">
                {invoice.installments.length} parcela(s)
              </p>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                {actionId === invoice.id ? (
                  <LoaderCircle className="size-5 animate-spin text-zinc-500" />
                ) : (
                  <>
                    {invoice.status === "OPEN" ? (
                      <button
                        type="button"
                        onClick={() =>
                          void executeAction(invoice.id, () =>
                            financeService.invoices.close(
                              invoice.id,
                            ),
                          )
                        }
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-zinc-300"
                      >
                        <Lock className="size-3.5" />
                        Fechar
                      </button>
                    ) : null}

                    {invoice.status === "CLOSED" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setPaymentInvoice(invoice)}
                          className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3 text-xs font-semibold text-black"
                        >
                          <Check className="size-3.5" />
                          Pagar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void executeAction(invoice.id, () =>
                              financeService.invoices.reopen(
                                invoice.id,
                              ),
                            )
                          }
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-zinc-300"
                        >
                          <Unlock className="size-3.5" />
                          Reabrir
                        </button>
                      </>
                    ) : null}

                    {invoice.status === "PAID" ? (
                      <button
                        type="button"
                        onClick={() =>
                          void executeAction(invoice.id, () =>
                            financeService.invoices.reversePayment(
                              invoice.id,
                            ),
                          )
                        }
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-zinc-300"
                      >
                        <RotateCcw className="size-3.5" />
                        Estornar
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Deseja excluir esta fatura?",
                          )
                        ) {
                          void executeAction(invoice.id, () =>
                            financeService.invoices.remove(
                              invoice.id,
                            ),
                          );
                        }
                      }}
                      className="inline-flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-rose-400/10 hover:text-rose-300"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {paymentInvoice ? (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/80 sm:items-center sm:p-6">
          <form
            onSubmit={submitPayment}
            className="w-full space-y-5 rounded-t-[2rem] border border-white/10 bg-[#101010] p-6 sm:max-w-md sm:rounded-[2rem]"
          >
            <h3 className="text-lg font-semibold text-white">
              Pagar fatura
            </h3>

            <select
              value={accountId}
              onChange={(event) =>
                setAccountId(event.target.value)
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white"
            >
              <option value="">Selecione a conta</option>
              {accounts
                .filter(
                  (account) =>
                    account.active ||
                    account.id === accountId,
                )
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
            </select>

            <input
              type="date"
              value={paymentDate}
              onChange={(event) =>
                setPaymentDate(event.target.value)
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white"
            />

            <select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(
                  event.target.value as FinancialPaymentMethod,
                )
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white"
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentInvoice(null)}
                className="h-11 rounded-xl border border-white/10 px-4 text-sm text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-11 rounded-xl bg-white px-5 text-sm font-semibold text-black"
              >
                Confirmar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}