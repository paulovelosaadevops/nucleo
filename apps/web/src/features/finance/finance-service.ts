import { apiRequest } from "@/lib/api/api-client";

import type {
  ChangeInitialBalanceRequest,
  CreateFinancialTransferRequest,
  CreateFinancialAccountRequest,
  CreateFinancialBudgetRequest,
  CreateFinancialCardPurchaseRequest,
  CreateFinancialCategoryRequest,
  CreateFinancialCreditCardRequest,
  ConfirmFinancialRecurrenceOccurrenceRequest,
  CreateFinancialInvestmentRequest,
  CreateFinancialRecurrenceRequest,
  CreateFinancialTransactionRequest,
  FinancialAccount,
  FinancialBudget,
  FinancialCardPurchaseFilters,
  FinancialCategory,
  FinancialCategoryType,
  FinancialCreditCard,
  FinancialCreditCardInvoice,
  FinancialCreditCardPurchase,
  FinancialDashboard,
  FinancialInvoiceImport,
  FinancialInvoiceImportConfirmRequest,
  FinancialInvoiceImportPreview,
  FinancialInvoiceImportResult,
  FinancialInvoiceImportRollback,
  FinancialInvoiceCategorySummary,
  FinancialInvestment,
  FinancialInvestmentDashboard,
  FinancialRecurrence,
  FinancialRecurrenceOccurrence,
  FinancialRecurrenceGenerationResult,
  FinancialTransaction,
  FinancialTransfer,
  FinancialTransactionFilters,
  InvestmentTransferRequest,
  PayFinancialInvoiceRequest,
  PostponeFinancialRecurrenceOccurrenceRequest,
  ReconcileInvestmentRequest,
  SkipFinancialRecurrenceOccurrenceRequest,
  UpdateFinancialAccountRequest,
  UpdateFinancialBudgetRequest,
  UpdateFinancialCardPurchaseRequest,
  UpdateFinancialCategoryRequest,
  UpdateFinancialCreditCardRequest,
  UpdateFinancialRecurrenceRequest,
  UpdateFinancialTransactionRequest,
} from "@/types/finance";

const FINANCE_BASE_PATH = "/api/finance";

function createQuery(
  values: Record<
    string,
    string | number | boolean | null | undefined
  >,
) {
  const query = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      query.set(key, String(value));
    }
  });

  const serialized = query.toString();

  return serialized ? `?${serialized}` : "";
}

export const financeService = {
  accounts: {
    create(
      request: CreateFinancialAccountRequest,
    ): Promise<FinancialAccount> {
      return apiRequest<FinancialAccount>(
        `${FINANCE_BASE_PATH}/accounts`,
        {
          method: "POST",
          body: request,
        },
      );
    },

    list(): Promise<FinancialAccount[]> {
      return apiRequest<FinancialAccount[]>(
        `${FINANCE_BASE_PATH}/accounts`,
      );
    },

    get(accountId: string): Promise<FinancialAccount> {
      return apiRequest<FinancialAccount>(
        `${FINANCE_BASE_PATH}/accounts/${accountId}`,
      );
    },

    update(
      accountId: string,
      request: UpdateFinancialAccountRequest,
    ): Promise<FinancialAccount> {
      return apiRequest<FinancialAccount>(
        `${FINANCE_BASE_PATH}/accounts/${accountId}`,
        {
          method: "PUT",
          body: request,
        },
      );
    },

    changeInitialBalance(
      accountId: string,
      request: ChangeInitialBalanceRequest,
    ): Promise<FinancialAccount> {
      return apiRequest<FinancialAccount>(
        `${FINANCE_BASE_PATH}/accounts/${accountId}/initial-balance`,
        {
          method: "PATCH",
          body: request,
        },
      );
    },

    activate(accountId: string): Promise<FinancialAccount> {
      return apiRequest<FinancialAccount>(
        `${FINANCE_BASE_PATH}/accounts/${accountId}/activate`,
        {
          method: "PATCH",
        },
      );
    },

    deactivate(accountId: string): Promise<FinancialAccount> {
      return apiRequest<FinancialAccount>(
        `${FINANCE_BASE_PATH}/accounts/${accountId}/deactivate`,
        {
          method: "PATCH",
        },
      );
    },

    remove(accountId: string): Promise<{ archived: boolean; message: string }> {
      return apiRequest<{ archived: boolean; message: string }>(
        `${FINANCE_BASE_PATH}/accounts/${accountId}`,
        {
          method: "DELETE",
        },
      );
    },
  },

  categories: {
    create(
      request: CreateFinancialCategoryRequest,
    ): Promise<FinancialCategory> {
      return apiRequest<FinancialCategory>(
        `${FINANCE_BASE_PATH}/categories`,
        {
          method: "POST",
          body: request,
        },
      );
    },

    list(
      type?: FinancialCategoryType,
    ): Promise<FinancialCategory[]> {
      const query = createQuery({ type });

      return apiRequest<FinancialCategory[]>(
        `${FINANCE_BASE_PATH}/categories${query}`,
      );
    },

    update(
      categoryId: string,
      request: UpdateFinancialCategoryRequest,
    ): Promise<FinancialCategory> {
      return apiRequest<FinancialCategory>(
        `${FINANCE_BASE_PATH}/categories/${categoryId}`,
        {
          method: "PUT",
          body: request,
        },
      );
    },

    activate(categoryId: string): Promise<FinancialCategory> {
      return apiRequest<FinancialCategory>(
        `${FINANCE_BASE_PATH}/categories/${categoryId}/activate`,
        {
          method: "PATCH",
        },
      );
    },

    deactivate(
      categoryId: string,
    ): Promise<FinancialCategory> {
      return apiRequest<FinancialCategory>(
        `${FINANCE_BASE_PATH}/categories/${categoryId}/deactivate`,
        {
          method: "PATCH",
        },
      );
    },

    remove(categoryId: string): Promise<void> {
      return apiRequest<void>(
        `${FINANCE_BASE_PATH}/categories/${categoryId}`,
        {
          method: "DELETE",
        },
      );
    },
  },

  dashboard: {
    get(from: string, to: string): Promise<FinancialDashboard> {
      const query = createQuery({
        from,
        to,
      });

      return apiRequest<FinancialDashboard>(
        `${FINANCE_BASE_PATH}/dashboard${query}`,
      );
    },
  },

  investments: {
    dashboard(): Promise<FinancialInvestmentDashboard> {
      return apiRequest<FinancialInvestmentDashboard>(
        `${FINANCE_BASE_PATH}/investments/dashboard`,
      );
    },

    list(): Promise<FinancialInvestment[]> {
      return apiRequest<FinancialInvestment[]>(
        `${FINANCE_BASE_PATH}/investments`,
      );
    },

    get(investmentId: string): Promise<FinancialInvestment> {
      return apiRequest<FinancialInvestment>(
        `${FINANCE_BASE_PATH}/investments/${investmentId}`,
      );
    },

    create(
      request: CreateFinancialInvestmentRequest,
    ): Promise<FinancialInvestment> {
      return apiRequest<FinancialInvestment>(
        `${FINANCE_BASE_PATH}/investments`,
        {
          method: "POST",
          body: request,
        },
      );
    },

    contribute(
      investmentId: string,
      request: InvestmentTransferRequest,
    ): Promise<FinancialInvestment> {
      return apiRequest<FinancialInvestment>(
        `${FINANCE_BASE_PATH}/investments/${investmentId}/contributions`,
        {
          method: "POST",
          body: request,
        },
      );
    },

    redeem(
      investmentId: string,
      request: InvestmentTransferRequest,
    ): Promise<FinancialInvestment> {
      return apiRequest<FinancialInvestment>(
        `${FINANCE_BASE_PATH}/investments/${investmentId}/redemptions`,
        {
          method: "POST",
          body: request,
        },
      );
    },

    reconcile(
      investmentId: string,
      request: ReconcileInvestmentRequest,
    ): Promise<FinancialInvestment> {
      return apiRequest<FinancialInvestment>(
        `${FINANCE_BASE_PATH}/investments/${investmentId}/reconciliations`,
        {
          method: "POST",
          body: request,
        },
      );
    },
  },

  transactions: {
    create(
      request: CreateFinancialTransactionRequest,
    ): Promise<FinancialTransaction> {
      return apiRequest<FinancialTransaction>(
        `${FINANCE_BASE_PATH}/transactions`,
        {
          method: "POST",
          body: request,
        },
      );
    },

    list(
      filters: FinancialTransactionFilters,
    ): Promise<FinancialTransaction[]> {
      const query = createQuery({
        from: filters.from,
        to: filters.to,
        type: filters.type,
        status: filters.status,
        accountId: filters.accountId,
        categoryId: filters.categoryId,
      });

      return apiRequest<FinancialTransaction[]>(
        `${FINANCE_BASE_PATH}/transactions${query}`,
      );
    },

    get(
      transactionId: string,
    ): Promise<FinancialTransaction> {
      return apiRequest<FinancialTransaction>(
        `${FINANCE_BASE_PATH}/transactions/${transactionId}`,
      );
    },

    update(
      transactionId: string,
      request: UpdateFinancialTransactionRequest,
    ): Promise<FinancialTransaction> {
      return apiRequest<FinancialTransaction>(
        `${FINANCE_BASE_PATH}/transactions/${transactionId}`,
        {
          method: "PUT",
          body: request,
        },
      );
    },

    pay(
      transactionId: string,
    ): Promise<FinancialTransaction> {
      return apiRequest<FinancialTransaction>(
        `${FINANCE_BASE_PATH}/transactions/${transactionId}/pay`,
        {
          method: "PATCH",
        },
      );
    },

    markPending(
      transactionId: string,
    ): Promise<FinancialTransaction> {
      return apiRequest<FinancialTransaction>(
        `${FINANCE_BASE_PATH}/transactions/${transactionId}/pending`,
        {
          method: "PATCH",
        },
      );
    },

    cancel(
      transactionId: string,
    ): Promise<FinancialTransaction> {
      return apiRequest<FinancialTransaction>(
        `${FINANCE_BASE_PATH}/transactions/${transactionId}/cancel`,
        {
          method: "PATCH",
        },
      );
    },

    restore(
      transactionId: string,
    ): Promise<FinancialTransaction> {
      return apiRequest<FinancialTransaction>(
        `${FINANCE_BASE_PATH}/transactions/${transactionId}/restore`,
        {
          method: "PATCH",
        },
      );
    },

    remove(transactionId: string): Promise<void> {
      return apiRequest<void>(
        `${FINANCE_BASE_PATH}/transactions/${transactionId}`,
        {
          method: "DELETE",
        },
      );
    },
  },

  transfers: {
    create(
      request: CreateFinancialTransferRequest,
    ): Promise<FinancialTransfer> {
      return apiRequest<FinancialTransfer>(
        `${FINANCE_BASE_PATH}/transfers`,
        {
          method: "POST",
          body: request,
        },
      );
    },
  },

  budgets: {
    create(
      request: CreateFinancialBudgetRequest,
    ): Promise<FinancialBudget> {
      return apiRequest<FinancialBudget>(
        `${FINANCE_BASE_PATH}/budgets`,
        {
          method: "POST",
          body: request,
        },
      );
    },

    list(referenceMonth: string): Promise<FinancialBudget[]> {
      const query = createQuery({
        referenceMonth,
      });

      return apiRequest<FinancialBudget[]>(
        `${FINANCE_BASE_PATH}/budgets${query}`,
      );
    },

    update(
      budgetId: string,
      request: UpdateFinancialBudgetRequest,
    ): Promise<FinancialBudget> {
      return apiRequest<FinancialBudget>(
        `${FINANCE_BASE_PATH}/budgets/${budgetId}`,
        {
          method: "PUT",
          body: request,
        },
      );
    },

    remove(budgetId: string): Promise<void> {
      return apiRequest<void>(
        `${FINANCE_BASE_PATH}/budgets/${budgetId}`,
        {
          method: "DELETE",
        },
      );
    },
  },

  recurrences: {
    create(
      request: CreateFinancialRecurrenceRequest,
    ): Promise<FinancialRecurrence> {
      return apiRequest<FinancialRecurrence>(
        `${FINANCE_BASE_PATH}/recurrences`,
        {
          method: "POST",
          body: request,
        },
      );
    },

    list(): Promise<FinancialRecurrence[]> {
      return apiRequest<FinancialRecurrence[]>(
        `${FINANCE_BASE_PATH}/recurrences`,
      );
    },

    occurrences(
      pendingOnly = false,
    ): Promise<FinancialRecurrenceOccurrence[]> {
      const query = createQuery({ pendingOnly });

      return apiRequest<FinancialRecurrenceOccurrence[]>(
        `${FINANCE_BASE_PATH}/recurrences/occurrences${query}`,
      );
    },

    confirmOccurrence(
      occurrenceId: string,
      request: ConfirmFinancialRecurrenceOccurrenceRequest,
    ): Promise<FinancialRecurrenceOccurrence> {
      return apiRequest<FinancialRecurrenceOccurrence>(
        `${FINANCE_BASE_PATH}/recurrences/occurrences/${occurrenceId}/confirm`,
        {
          method: "POST",
          body: request,
        },
      );
    },

    skipOccurrence(
      occurrenceId: string,
      request: SkipFinancialRecurrenceOccurrenceRequest,
    ): Promise<FinancialRecurrenceOccurrence> {
      return apiRequest<FinancialRecurrenceOccurrence>(
        `${FINANCE_BASE_PATH}/recurrences/occurrences/${occurrenceId}/skip`,
        {
          method: "PATCH",
          body: request,
        },
      );
    },

    postponeOccurrence(
      occurrenceId: string,
      request: PostponeFinancialRecurrenceOccurrenceRequest,
    ): Promise<FinancialRecurrenceOccurrence> {
      return apiRequest<FinancialRecurrenceOccurrence>(
        `${FINANCE_BASE_PATH}/recurrences/occurrences/${occurrenceId}/postpone`,
        {
          method: "PATCH",
          body: request,
        },
      );
    },

    update(
      recurrenceId: string,
      request: UpdateFinancialRecurrenceRequest,
    ): Promise<FinancialRecurrence> {
      return apiRequest<FinancialRecurrence>(
        `${FINANCE_BASE_PATH}/recurrences/${recurrenceId}`,
        {
          method: "PUT",
          body: request,
        },
      );
    },

    pause(recurrenceId: string): Promise<FinancialRecurrence> {
      return apiRequest<FinancialRecurrence>(
        `${FINANCE_BASE_PATH}/recurrences/${recurrenceId}/pause`,
        {
          method: "PATCH",
        },
      );
    },

    resume(
      recurrenceId: string,
    ): Promise<FinancialRecurrence> {
      return apiRequest<FinancialRecurrence>(
        `${FINANCE_BASE_PATH}/recurrences/${recurrenceId}/resume`,
        {
          method: "PATCH",
        },
      );
    },

    generate(
      until?: string,
    ): Promise<FinancialRecurrenceGenerationResult> {
      const query = createQuery({ until });

      return apiRequest<FinancialRecurrenceGenerationResult>(
        `${FINANCE_BASE_PATH}/recurrences/generate${query}`,
        {
          method: "POST",
        },
      );
    },

    remove(recurrenceId: string): Promise<void> {
      return apiRequest<void>(
        `${FINANCE_BASE_PATH}/recurrences/${recurrenceId}`,
        {
          method: "DELETE",
        },
      );
    },
  },

  creditCards: {
    create(
      request: CreateFinancialCreditCardRequest,
    ): Promise<FinancialCreditCard> {
      return apiRequest<FinancialCreditCard>(
        `${FINANCE_BASE_PATH}/credit-cards`,
        {
          method: "POST",
          body: request,
        },
      );
    },

    list(): Promise<FinancialCreditCard[]> {
      return apiRequest<FinancialCreditCard[]>(
        `${FINANCE_BASE_PATH}/credit-cards`,
      );
    },

    get(cardId: string): Promise<FinancialCreditCard> {
      return apiRequest<FinancialCreditCard>(
        `${FINANCE_BASE_PATH}/credit-cards/${cardId}`,
      );
    },

    update(
      cardId: string,
      request: UpdateFinancialCreditCardRequest,
    ): Promise<FinancialCreditCard> {
      return apiRequest<FinancialCreditCard>(
        `${FINANCE_BASE_PATH}/credit-cards/${cardId}`,
        {
          method: "PUT",
          body: request,
        },
      );
    },

    activate(cardId: string): Promise<FinancialCreditCard> {
      return apiRequest<FinancialCreditCard>(
        `${FINANCE_BASE_PATH}/credit-cards/${cardId}/activate`,
        {
          method: "PATCH",
        },
      );
    },

    deactivate(cardId: string): Promise<FinancialCreditCard> {
      return apiRequest<FinancialCreditCard>(
        `${FINANCE_BASE_PATH}/credit-cards/${cardId}/deactivate`,
        {
          method: "PATCH",
        },
      );
    },

    remove(cardId: string): Promise<void> {
      return apiRequest<void>(
        `${FINANCE_BASE_PATH}/credit-cards/${cardId}`,
        {
          method: "DELETE",
        },
      );
    },
  },

  cardPurchases: {
    create(
      request: CreateFinancialCardPurchaseRequest,
    ): Promise<FinancialCreditCardPurchase> {
      return apiRequest<FinancialCreditCardPurchase>(
        `${FINANCE_BASE_PATH}/credit-card-purchases`,
        {
          method: "POST",
          body: request,
        },
      );
    },

    list(
      filters: FinancialCardPurchaseFilters,
    ): Promise<FinancialCreditCardPurchase[]> {
      const query = createQuery({
        from: filters.from,
        to: filters.to,
      });

      return apiRequest<FinancialCreditCardPurchase[]>(
        `${FINANCE_BASE_PATH}/credit-card-purchases${query}`,
      );
    },

    get(
      purchaseId: string,
    ): Promise<FinancialCreditCardPurchase> {
      return apiRequest<FinancialCreditCardPurchase>(
        `${FINANCE_BASE_PATH}/credit-card-purchases/${purchaseId}`,
      );
    },

    update(
      purchaseId: string,
      request: UpdateFinancialCardPurchaseRequest,
    ): Promise<FinancialCreditCardPurchase> {
      return apiRequest<FinancialCreditCardPurchase>(
        `${FINANCE_BASE_PATH}/credit-card-purchases/${purchaseId}`,
        {
          method: "PUT",
          body: request,
        },
      );
    },

    cancel(
      purchaseId: string,
    ): Promise<FinancialCreditCardPurchase> {
      return apiRequest<FinancialCreditCardPurchase>(
        `${FINANCE_BASE_PATH}/credit-card-purchases/${purchaseId}/cancel`,
        {
          method: "PATCH",
        },
      );
    },

    restore(
      purchaseId: string,
    ): Promise<FinancialCreditCardPurchase> {
      return apiRequest<FinancialCreditCardPurchase>(
        `${FINANCE_BASE_PATH}/credit-card-purchases/${purchaseId}/restore`,
        {
          method: "PATCH",
        },
      );
    },

    remove(purchaseId: string): Promise<void> {
      return apiRequest<void>(
        `${FINANCE_BASE_PATH}/credit-card-purchases/${purchaseId}`,
        {
          method: "DELETE",
        },
      );
    },
  },

  invoices: {
    list(
      creditCardId: string,
    ): Promise<FinancialCreditCardInvoice[]> {
      const query = createQuery({
        creditCardId,
      });

      return apiRequest<FinancialCreditCardInvoice[]>(
        `${FINANCE_BASE_PATH}/credit-card-invoices${query}`,
      );
    },

    get(
      invoiceId: string,
    ): Promise<FinancialCreditCardInvoice> {
      return apiRequest<FinancialCreditCardInvoice>(
        `${FINANCE_BASE_PATH}/credit-card-invoices/${invoiceId}`,
      );
    },

    categorySummary(
      invoiceId: string,
    ): Promise<FinancialInvoiceCategorySummary[]> {
      return apiRequest<FinancialInvoiceCategorySummary[]>(
        `${FINANCE_BASE_PATH}/credit-card-invoices/${invoiceId}/category-summary`,
      );
    },

    close(
      invoiceId: string,
    ): Promise<FinancialCreditCardInvoice> {
      return apiRequest<FinancialCreditCardInvoice>(
        `${FINANCE_BASE_PATH}/credit-card-invoices/${invoiceId}/close`,
        {
          method: "PATCH",
        },
      );
    },

    reopen(
      invoiceId: string,
    ): Promise<FinancialCreditCardInvoice> {
      return apiRequest<FinancialCreditCardInvoice>(
        `${FINANCE_BASE_PATH}/credit-card-invoices/${invoiceId}/reopen`,
        {
          method: "PATCH",
        },
      );
    },

    pay(
      invoiceId: string,
      request: PayFinancialInvoiceRequest,
    ): Promise<FinancialCreditCardInvoice> {
      return apiRequest<FinancialCreditCardInvoice>(
        `${FINANCE_BASE_PATH}/credit-card-invoices/${invoiceId}/pay`,
        {
          method: "POST",
          body: request,
        },
      );
    },

    reversePayment(
      invoiceId: string,
    ): Promise<FinancialCreditCardInvoice> {
      return apiRequest<FinancialCreditCardInvoice>(
        `${FINANCE_BASE_PATH}/credit-card-invoices/${invoiceId}/payment`,
        {
          method: "DELETE",
        },
      );
    },

    remove(invoiceId: string): Promise<void> {
      return apiRequest<void>(
        `${FINANCE_BASE_PATH}/credit-card-invoices/${invoiceId}`,
        {
          method: "DELETE",
        },
      );
    },
  },

  invoiceImports: {
    preview(
      cardId: string,
      file: File,
    ): Promise<FinancialInvoiceImportPreview> {
      const body = new FormData();
      body.append("file", file);
      const query = createQuery({ cardId });

      return apiRequest<FinancialInvoiceImportPreview>(
        `${FINANCE_BASE_PATH}/invoice-imports/preview${query}`,
        {
          method: "POST",
          body,
        },
      );
    },

    confirm(
      token: string,
      request: FinancialInvoiceImportConfirmRequest,
    ): Promise<FinancialInvoiceImportResult> {
      return apiRequest<FinancialInvoiceImportResult>(
        `${FINANCE_BASE_PATH}/invoice-imports/${token}/confirm`,
        {
          method: "POST",
          body: request,
        },
      );
    },

    list(): Promise<FinancialInvoiceImport[]> {
      return apiRequest<FinancialInvoiceImport[]>(
        `${FINANCE_BASE_PATH}/invoice-imports`,
      );
    },

    rollback(
      importId: string,
    ): Promise<FinancialInvoiceImportRollback> {
      return apiRequest<FinancialInvoiceImportRollback>(
        `${FINANCE_BASE_PATH}/invoice-imports/${importId}/rollback`,
        {
          method: "POST",
        },
      );
    },
  },
};
