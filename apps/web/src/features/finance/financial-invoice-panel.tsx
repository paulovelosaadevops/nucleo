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
  LoaderCircle,
  Lock,
  ReceiptText,
  RotateCcw,
  Trash2,
  Unlock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/ui/modal-shell";
import type {
  FinancialAccount,
  FinancialCreditCard,
  FinancialCreditCardInstallment,
  FinancialCreditCardInvoice,
  FinancialPaymentMethod,
} from "@/types/finance";

import { financeService } from "./finance-service";

interface FinancialInvoicePanelProps {
  card: FinancialCreditCard;
  accounts: FinancialAccount[];
  initialInvoiceId?: string | null;
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
  { value: "BANK_TRANSFER", label: "Transferencia" },
  { value: "DIRECT_DEBIT", label: "Debito automatico" },
  { value: "CASH", label: "Dinheiro" },
  { value: "OTHER", label: "Outro" },
];

function todayAsInputValue() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(`${value}T00:00:00`),
  );
}

function formatMonth(value: string) {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));

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

function invoiceStatusDetails(invoice: FinancialCreditCardInvoice) {
  const overdue =
    invoice.status === "CLOSED" && invoice.dueDate < todayAsInputValue();

  if (overdue) {
    return {
      label: "Vencida",
      className: "border-red-400/20 bg-red-400/10 text-red-300",
    };
  }

  switch (invoice.status) {
    case "OPEN":
      return {
        label: "Aberta",
        className: "border-amber-400/20 bg-amber-400/10 text-amber-300",
      };
    case "CLOSED":
      return {
        label: "Fechada",
        className: "border-blue-400/20 bg-blue-400/10 text-blue-300",
      };
    case "PAID":
      return {
        label: "Paga",
        className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      };
    case "CANCELLED":
      return {
        label: "Cancelada",
        className: "border-white/10 bg-white/[0.04] text-zinc-500",
      };
  }
}

function installmentDate(installment: FinancialCreditCardInstallment) {
  return installment.invoiceReferenceMonth;
}

export function FinancialInvoicePanel({
  card,
  accounts,
  initialInvoiceId,
  onChanged,
  onClose,
}: FinancialInvoicePanelProps) {
  const [invoices, setInvoices] = useState<FinancialCreditCardInvoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null,
  );
  const [paymentInvoice, setPaymentInvoice] =
    useState<FinancialCreditCardInvoice | null>(null);
  const [purchaseActionId, setPurchaseActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [accountId, setAccountId] = useState(card.paymentAccountId ?? "");
  const [paymentDate, setPaymentDate] = useState(todayAsInputValue());
  const [paymentMethod, setPaymentMethod] =
    useState<FinancialPaymentMethod>("PIX");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    try {
      const response = await financeService.invoices.list(card.id);
      const ordered = orderInvoices(response);

      setInvoices(ordered);
      setError(null);
      setSelectedInvoiceId(
        (current) => initialInvoiceId ?? current ?? ordered[0]?.id ?? null,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel carregar as faturas.",
      );
    } finally {
      setLoading(false);
    }
  }, [card.id, initialInvoiceId]);

  useEffect(() => {
    let active = true;

    financeService.invoices
      .list(card.id)
      .then((response) => {
        if (!active) return;

        const ordered = orderInvoices(response);

        setInvoices(ordered);
        setError(null);
        setSelectedInvoiceId(
          (current) => initialInvoiceId ?? current ?? ordered[0]?.id ?? null,
        );
      })
      .catch((requestError: unknown) => {
        if (!active) return;

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel carregar as faturas.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [card.id, initialInvoiceId]);

  const selectedInvoice = useMemo(
    () =>
      invoices.find((invoice) => invoice.id === selectedInvoiceId) ??
      invoices[0] ??
      null,
    [invoices, selectedInvoiceId],
  );

  const selectedInstallments = useMemo(
    () =>
      selectedInvoice
        ? [...selectedInvoice.installments].sort((left, right) =>
            installmentDate(right).localeCompare(installmentDate(left)),
          )
        : [],
    [selectedInvoice],
  );

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
          : "Nao foi possivel realizar a acao.",
      );

      return false;
    } finally {
      setActionId(null);
    }
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!paymentInvoice) return;

    if (!accountId) {
      setError("Selecione a conta usada para pagar a fatura.");
      return;
    }

    if (!paymentDate) {
      setError("Informe a data do pagamento.");
      return;
    }

    const succeeded = await executeAction(paymentInvoice.id, () =>
      financeService.invoices.pay(paymentInvoice.id, {
        accountId,
        paymentDate,
        paymentMethod,
      }),
    );

    if (succeeded) {
      setPaymentInvoice(null);
    }
  }

  async function deleteInvoice(invoiceId: string) {
    const succeeded = await executeAction(invoiceId, () =>
      financeService.invoices.remove(invoiceId),
    );

    if (succeeded) {
      setSelectedInvoiceId(
        invoices.find((invoice) => invoice.id !== invoiceId)?.id ?? null,
      );
    }
  }

  async function deletePurchase(installment: FinancialCreditCardInstallment) {
    if (purchaseActionId) return;

    const confirmed = window.confirm(
      installment.totalInstallments > 1
        ? `Esta compra possui ${installment.totalInstallments} parcelas vinculadas. A exclusao removera a compra e todas as parcelas permitidas pelas regras atuais, incluindo faturas futuras. Deseja continuar?`
        : "Excluir esta compra da fatura?",
    );

    if (!confirmed) return;

    setPurchaseActionId(installment.purchaseId);
    setError(null);
    setMessage(null);

    try {
      await financeService.cardPurchases.remove(installment.purchaseId);
      await loadInvoices();
      onChanged?.();
      setMessage("Compra excluida da fatura.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel excluir a compra.",
      );
    } finally {
      setPurchaseActionId(null);
    }
  }

  function retryLoad() {
    setLoading(true);
    setError(null);
    void loadInvoices();
  }

  const selectedStatus = selectedInvoice
    ? invoiceStatusDetails(selectedInvoice)
    : null;
  const selectedProcessing = selectedInvoice
    ? actionId === selectedInvoice.id
    : false;

  return (
    <ModalShell
      eyebrow="Faturas"
      title={`${card.name} •••• ${card.lastFour}`}
      titleId="invoice-panel-title"
      busy={Boolean(actionId)}
      size="medium"
      onClose={onClose}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-white/10 bg-[#090909]/95 px-5 py-4 backdrop-blur-xl sm:px-7">
          {selectedInvoice ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-300">
                    {card.name} •••• {card.lastFour}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white">
                      {formatMonth(selectedInvoice.referenceMonth)}
                    </p>

                    {selectedStatus ? (
                      <span
                        className={[
                          "rounded-lg border px-2 py-1 text-[0.68rem] font-medium",
                          selectedStatus.className,
                        ].join(" ")}
                      >
                        {selectedStatus.label}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Fecha em {formatDate(selectedInvoice.closingDate)} · Vence
                    em {formatDate(selectedInvoice.dueDate)}
                  </p>
                </div>

                <p className="shrink-0 text-xl font-semibold text-white tabular-nums">
                  {currencyFormatter.format(selectedInvoice.totalAmount)}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {invoices.length > 1 ? (
                  <label className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>Mes</span>
                    <select
                      value={selectedInvoice.id}
                      onChange={(event) =>
                        setSelectedInvoiceId(event.target.value)
                      }
                      className="h-9 rounded-xl border border-white/10 bg-white/[0.045] px-3 text-sm text-white outline-none transition focus:border-white/30"
                    >
                      {invoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {formatMonth(invoice.referenceMonth)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <span className="text-xs text-zinc-600">
                    {selectedInstallments.length}{" "}
                    {selectedInstallments.length === 1 ? "compra" : "compras"}
                  </span>
                )}

                <InvoiceActions
                  invoice={selectedInvoice}
                  card={card}
                  processing={selectedProcessing}
                  onCloseInvoice={() =>
                    void executeAction(selectedInvoice.id, () =>
                      financeService.invoices.close(selectedInvoice.id),
                    )
                  }
                  onPay={() => {
                    setAccountId(card.paymentAccountId ?? "");
                    setPaymentDate(todayAsInputValue());
                    setPaymentInvoice(selectedInvoice);
                  }}
                  onReopen={() =>
                    void executeAction(selectedInvoice.id, () =>
                      financeService.invoices.reopen(selectedInvoice.id),
                    )
                  }
                  onReversePayment={() =>
                    void executeAction(selectedInvoice.id, () =>
                      financeService.invoices.reversePayment(selectedInvoice.id),
                    )
                  }
                  onDeleteInvoice={() => {
                    if (window.confirm("Deseja excluir esta fatura vazia?")) {
                      void deleteInvoice(selectedInvoice.id);
                    }
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-7">
          <div className="space-y-4">
            {message ? (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-sm text-emerald-200">
                {message}
              </div>
            ) : null}

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

            {!loading && error && invoices.length === 0 ? (
              <div className="flex justify-center">
                <Button type="button" variant="secondary" onClick={retryLoad}>
                  Tentar novamente
                </Button>
              </div>
            ) : null}

            {!loading && !error && invoices.length === 0 ? (
              <div className="flex min-h-60 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 p-8 text-center">
                <ReceiptText className="size-8 text-zinc-600" />
                <p className="mt-4 font-medium text-zinc-300">
                  Nenhuma fatura encontrada
                </p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                  As faturas serao criadas automaticamente quando uma compra for
                  registrada neste cartao.
                </p>
              </div>
            ) : null}

            {!loading && selectedInvoice && selectedInstallments.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 p-6 text-center">
                <ReceiptText className="size-6 text-zinc-600" />
                <p className="mt-3 text-sm font-medium text-zinc-300">
                  Esta fatura nao possui lancamentos.
                </p>
              </div>
            ) : null}

            {!loading && selectedInstallments.length > 0 ? (
              <div className="divide-y divide-white/[0.07] overflow-hidden border-y border-white/[0.07]">
                {selectedInstallments.map((installment) => (
                  <PurchaseRow
                    key={installment.id}
                    installment={installment}
                    deleting={purchaseActionId === installment.purchaseId}
                    disabled={Boolean(purchaseActionId)}
                    onDelete={() => void deletePurchase(installment)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {paymentInvoice ? (
        <ModalShell
          eyebrow="Pagamento integral"
          title={`Pagar fatura de ${formatMonth(paymentInvoice.referenceMonth)}`}
          titleId="invoice-payment-title"
          busy={actionId === paymentInvoice.id}
          size="small"
          layer="nested"
          onClose={() => setPaymentInvoice(null)}
        >
          <form
            onSubmit={submitPayment}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-7">
              <p className="text-2xl font-semibold text-white">
                {currencyFormatter.format(paymentInvoice.totalAmount)}
              </p>

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
                  onChange={(event) => setAccountId(event.target.value)}
                >
                  <option value="">Selecione a conta</option>
                  {accounts
                    .filter(
                      (account) => account.active || account.id === accountId,
                    )
                    .map((account) => (
                      <option key={account.id} value={account.id}>
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
                onChange={(event) => setPaymentDate(event.target.value)}
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
                    const validMethod = paymentMethods.find(
                      (method) => method.value === event.target.value,
                    );

                    if (validMethod) {
                      setPaymentMethod(validMethod.value);
                    }
                  }}
                >
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-white/10 bg-[#090909]/95 p-5 backdrop-blur-xl sm:flex-row sm:justify-end sm:px-7">
              <Button
                type="button"
                variant="secondary"
                disabled={actionId === paymentInvoice.id}
                onClick={() => setPaymentInvoice(null)}
              >
                Cancelar
              </Button>

              <Button type="submit" loading={actionId === paymentInvoice.id}>
                Confirmar pagamento
              </Button>
            </footer>
          </form>
        </ModalShell>
      ) : null}
    </ModalShell>
  );
}

function InvoiceActions({
  invoice,
  card,
  processing,
  onCloseInvoice,
  onPay,
  onReopen,
  onReversePayment,
  onDeleteInvoice,
}: {
  invoice: FinancialCreditCardInvoice;
  card: FinancialCreditCard;
  processing: boolean;
  onCloseInvoice: () => void;
  onPay: () => void;
  onReopen: () => void;
  onReversePayment: () => void;
  onDeleteInvoice: () => void;
}) {
  if (processing) {
    return (
      <div className="flex h-9 items-center justify-end">
        <LoaderCircle className="size-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 sm:justify-end">
      {invoice.status === "OPEN" ? (
        <Button type="button" variant="secondary" size="small" onClick={onCloseInvoice}>
          <Lock className="size-3.5" />
          Fechar
        </Button>
      ) : null}

      {invoice.status === "CLOSED" ? (
        <>
          <Button type="button" size="small" onClick={onPay}>
            <Check className="size-3.5" />
            Pagar
          </Button>
          <Button type="button" variant="secondary" size="small" onClick={onReopen}>
            <Unlock className="size-3.5" />
            Reabrir
          </Button>
        </>
      ) : null}

      {invoice.status === "PAID" ? (
        <Button
          type="button"
          variant="secondary"
          size="small"
          onClick={onReversePayment}
        >
          <RotateCcw className="size-3.5" />
          Estornar
        </Button>
      ) : null}

      {invoice.installments.length === 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="small"
          className="text-red-300"
          onClick={onDeleteInvoice}
          title={`Excluir fatura de ${card.name}`}
        >
          <Trash2 className="size-3.5" />
          Excluir
        </Button>
      ) : null}
    </div>
  );
}

function PurchaseRow({
  installment,
  deleting,
  disabled,
  onDelete,
}: {
  installment: FinancialCreditCardInstallment;
  deleting: boolean;
  disabled: boolean;
  onDelete: () => void;
}) {
  const showInstallment =
    installment.totalInstallments > 1 ||
    installment.installmentNumber > 1;

  return (
    <div
      className={[
        "grid min-h-12 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-1 py-2 transition hover:bg-white/[0.025] sm:min-h-11 sm:grid-cols-[5.5rem_minmax(0,1fr)_8rem_2.5rem] sm:px-3",
        installment.status === "CANCELLED" ? "opacity-60" : "",
      ].join(" ")}
    >
      <p className="hidden text-xs text-zinc-500 sm:block">
        {formatDate(installmentDate(installment))}
      </p>

      <div className="min-w-0">
        <div className="flex min-w-0 items-start justify-between gap-3 sm:block">
          <p
            title={installment.purchaseDescription}
            className="truncate text-sm font-medium text-zinc-200"
          >
            {installment.purchaseDescription}
          </p>

          <p className="shrink-0 text-sm font-semibold text-white tabular-nums sm:hidden">
            {currencyFormatter.format(installment.amount)}
          </p>
        </div>

        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">
          <span className="sm:hidden">{formatDate(installmentDate(installment))}</span>
          <span className="truncate">{installment.categoryName ?? "Sem categoria"}</span>
          {showInstallment ? (
            <span>
              Parcela {installment.installmentNumber}/{installment.totalInstallments}
            </span>
          ) : null}
          {installment.status === "CANCELLED" ? <span>Cancelada</span> : null}
          {installment.paid ? <span>Paga</span> : null}
        </div>
      </div>

      <p className="hidden text-right text-sm font-semibold text-white tabular-nums sm:block">
        {currencyFormatter.format(installment.amount)}
      </p>

      <button
        type="button"
        title="Excluir compra"
        aria-label={`Excluir compra ${installment.purchaseDescription}`}
        disabled={deleting || disabled}
        onClick={onDelete}
        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 outline-none transition hover:bg-rose-400/10 hover:text-rose-300 focus-visible:ring-2 focus-visible:ring-white/45 disabled:opacity-45"
      >
        {deleting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}
      </button>
    </div>
  );
}
