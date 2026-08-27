export type FinancialTransactionType = "INCOME" | "EXPENSE";
export type FinancialTransactionStatus = "PENDING" | "PAID" | "CANCELLED";
export type FinancialCategoryType = "INCOME" | "EXPENSE";
export type FinancialAccountType = "CASH" | "CHECKING" | "SAVINGS" | "INVESTMENT" | "DIGITAL_WALLET" | "OTHER";
export type FinancialPaymentMethod = "PIX" | "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "BANK_TRANSFER" | "BANK_SLIP" | "DIRECT_DEBIT" | "OTHER";
export type FinancialBudgetStatus = "SAFE" | "ALERT" | "EXCEEDED";
export type FinancialRecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type FinancialCreditCardBrand = "VISA" | "MASTERCARD" | "ELO" | "AMERICAN_EXPRESS" | "HIPERCARD" | "OTHER";
export type FinancialCreditCardPurchaseStatus = "ACTIVE" | "CANCELLED";
export type FinancialCreditCardPurchaseType = "DEBIT" | "CREDIT";
export type FinancialCreditCardInstallmentStatus = "OPEN" | "CANCELLED";
export type FinancialCreditCardInvoiceStatus = "OPEN" | "CLOSED" | "PAID" | "CANCELLED";
export type FinancialInvestmentModality = "PERCENT_CDI" | "CDI_PLUS" | "PERCENT_SELIC" | "FIXED_RATE" | "IPCA_PLUS" | "SAVINGS" | "MANUAL" | "NO_YIELD";
export type FinancialInvestmentAccrualStartRule = "SAME_BUSINESS_DAY" | "NEXT_BUSINESS_DAY" | "SETTLEMENT_DATE";
export type FinancialInvestmentMovementType = "INITIAL_BALANCE" | "CONTRIBUTION" | "REDEMPTION" | "YIELD" | "VALUATION_ADJUSTMENT" | "RECONCILIATION" | "CONFIGURATION_CHANGE";
export type FinancialInvestmentValuationStatus = "ESTIMATED" | "RECONCILED";

export interface CreateFinancialAccountRequest { name: string; type: FinancialAccountType; initialBalance: number; color: string | null; includeInTotal: boolean; }
export interface UpdateFinancialAccountRequest { name: string; type: FinancialAccountType; color: string | null; includeInTotal: boolean; }
export interface ChangeInitialBalanceRequest { initialBalance: number; }
export interface FinancialAccount { id: string; name: string; type: FinancialAccountType; initialBalance: number; paidMovementBalance: number; currentBalance: number; color: string | null; includeInTotal: boolean; active: boolean; createdByUserId: string; createdByName: string; createdAt: string; updatedAt: string; }

export interface CreateFinancialCategoryRequest { name: string; type: FinancialCategoryType; color: string | null; icon: string | null; }
export interface UpdateFinancialCategoryRequest { name: string; color: string | null; icon: string | null; }
export interface FinancialCategory { id: string; name: string; type: FinancialCategoryType; color: string | null; icon: string | null; active: boolean; createdAt: string; updatedAt: string; }
export interface FinancialCategorySummary { categoryId: string | null; categoryName: string; color: string | null; icon: string | null; type: FinancialCategoryType; transactionCount: number; total: number; percentage: number; }

export interface FinancialInvoiceProjection { invoiceId: string; creditCardId: string; creditCardName: string; lastFour: string | null; referenceMonth: string; closingDate: string; dueDate: string; status: FinancialCreditCardInvoiceStatus; totalAmount: number; installmentCount: number; }
export interface FinancialUpcomingInvoiceTotal { referenceMonth: string; totalAmount: number; invoiceCount: number; }
export interface FinancialMonthlyProjection { referenceMonth: string; expectedIncome: number; accountExpenses: number; creditCardExpenses: number; recurrenceForecast: number; totalCommitted: number; projectedResult: number; }
export interface FinancialDashboardRecurrence { id: string; description: string; amount: number; type: FinancialTransactionType; frequency: FinancialRecurrenceFrequency; interval: number; nextGenerationDate: string; sourceName: string; creditCard: boolean; }
export interface FinancialInstallmentCommitment { purchaseId: string; description: string; creditCardName: string; currentInstallment: number; totalInstallments: number; remainingInstallments: number; installmentAmount: number; remainingAmount: number; nextDueDate: string; }
export interface FinancialBudgetProgress { budgetId: string; categoryId: string; categoryName: string; limitAmount: number; committedAmount: number; remainingAmount: number; consumptionPercentage: number; status: FinancialBudgetStatus; }
export interface FinancialUpcomingItem { kind: "TRANSACTION" | "INVOICE_INSTALLMENT"; id: string; description: string; sourceName: string; dueDate: string; amount: number; overdue: boolean; }
export interface FinancialInvestmentDashboard { investedBalance: number; contributedThisMonth: number; gainOrLossThisMonth: number; monthlyReturnPercentage: number; valuationStatus: FinancialInvestmentValuationStatus; lastUpdatedAt: string | null; }

export interface FinancialDashboard {
  from: string; to: string; totalAccountBalance: number; availableAccountBalance: number; investmentBalance: number; projectedBalance: number;
  totalIncome: number; totalExpense: number; periodBalance: number;
  pendingIncome: number; pendingExpense: number; overdueExpense: number;
  overdueTransactionCount: number; currentInvoiceAmount: number;
  remainingInstallmentAmount: number; activeInstallmentPurchaseCount: number;
  recurringExpenseNext30Days: number; activeRecurrenceCount: number;
  investmentSummary: FinancialInvestmentDashboard;
  incomeByCategory: FinancialCategorySummary[]; expenseByCategory: FinancialCategorySummary[];
  invoices: FinancialInvoiceProjection[]; upcomingInvoices: FinancialUpcomingInvoiceTotal[]; nextThreeMonths: FinancialMonthlyProjection[];
  recurrences: FinancialDashboardRecurrence[]; installmentCommitments: FinancialInstallmentCommitment[];
  budgets: FinancialBudgetProgress[]; upcomingItems: FinancialUpcomingItem[];
}

export interface CreateFinancialTransactionRequest { accountId: string; categoryId: string | null; type: FinancialTransactionType; description: string; amount: number; transactionDate: string; dueDate: string | null; status: FinancialTransactionStatus; paymentMethod: FinancialPaymentMethod | null; notes: string | null; }
export interface UpdateFinancialTransactionRequest { accountId: string; categoryId: string | null; type: FinancialTransactionType; description: string; amount: number; transactionDate: string; dueDate: string | null; paymentMethod: FinancialPaymentMethod | null; notes: string | null; }
export interface FinancialTransaction { id: string; accountId: string; accountName: string; categoryId: string | null; categoryName: string | null; categoryColor: string | null; categoryIcon: string | null; type: FinancialTransactionType; description: string; amount: number; transactionDate: string; dueDate: string | null; status: FinancialTransactionStatus; paymentMethod: FinancialPaymentMethod | null; paidAt: string | null; overdue: boolean; notes: string | null; recurrenceId: string | null; recurrenceSequence: number | null; creditCardInvoiceId: string | null; invoicePayment: boolean; excludedFromReports: boolean; createdByUserId: string; createdByName: string; createdAt: string; updatedAt: string; }
export interface FinancialTransactionFilters { from: string; to: string; type?: FinancialTransactionType; status?: FinancialTransactionStatus; accountId?: string; categoryId?: string; }

export interface CreateFinancialBudgetRequest { categoryId: string; referenceMonth: string; limitAmount: number; alertPercentage: number; }
export interface UpdateFinancialBudgetRequest { limitAmount: number; alertPercentage: number; }
export interface FinancialBudget { id: string; categoryId: string; categoryName: string; categoryColor: string | null; categoryIcon: string | null; referenceMonth: string; limitAmount: number; paidAmount: number; pendingAmount: number; committedAmount: number; remainingAmount: number; consumptionPercentage: number; alertPercentage: number; status: FinancialBudgetStatus; createdAt: string; updatedAt: string; }

export interface CreateFinancialRecurrenceRequest { accountId: string | null; creditCardId: string | null; categoryId: string | null; type: FinancialTransactionType; description: string; amount: number; frequency: FinancialRecurrenceFrequency; interval: number; startDate: string; endDate: string | null; occurrenceCount: number | null; paymentMethod: FinancialPaymentMethod | null; notes: string | null; }
export interface UpdateFinancialRecurrenceRequest { accountId: string | null; creditCardId: string | null; categoryId: string | null; type: FinancialTransactionType; description: string; amount: number; paymentMethod: FinancialPaymentMethod | null; notes: string | null; }
export interface FinancialRecurrence { id: string; accountId: string | null; accountName: string | null; creditCardId: string | null; creditCardName: string | null; categoryId: string | null; categoryName: string | null; type: FinancialTransactionType; description: string; amount: number; frequency: FinancialRecurrenceFrequency; interval: number; startDate: string; endDate: string | null; nextGenerationDate: string | null; remainingOccurrences: number | null; paymentMethod: FinancialPaymentMethod | null; notes: string | null; active: boolean; createdByUserId: string; createdByName: string; createdAt: string; updatedAt: string; }
export interface FinancialRecurrenceGenerationResult { generatedUntil: string; processedRecurrences: number; createdTransactions: number; createdCreditCardPurchases: number; }

export interface CreateFinancialCreditCardRequest { name: string; brand: FinancialCreditCardBrand; lastFour: string; creditLimit: number; closingDay: number; dueDay: number; paymentAccountId: string; color: string | null; }
export interface UpdateFinancialCreditCardRequest { name: string; brand: FinancialCreditCardBrand; lastFour: string; creditLimit: number; closingDay: number; dueDay: number; paymentAccountId: string; color: string | null; }
export interface FinancialCreditCard { id: string; name: string; brand: FinancialCreditCardBrand; lastFour: string; creditLimit: number; outstandingAmount: number; availableLimit: number; closingDay: number; dueDay: number; paymentAccountId: string; paymentAccountName: string; color: string | null; active: boolean; createdByName: string; createdAt: string; updatedAt: string; }
export interface CreateFinancialCardPurchaseRequest { creditCardId: string; categoryId: string | null; description: string; totalAmount: number; purchaseType?: FinancialCreditCardPurchaseType | null; purchaseDate: string; totalInstallments: number; notes: string | null; }
export interface UpdateFinancialCardPurchaseRequest { categoryId: string | null; description: string; notes: string | null; }
export interface FinancialCreditCardInstallment { id: string; purchaseId: string; purchaseDescription: string; purchaseDate: string; purchaseType: FinancialCreditCardPurchaseType; categoryId: string | null; categoryName: string | null; installmentNumber: number; totalInstallments: number; amount: number; status: FinancialCreditCardInstallmentStatus; paid: boolean; invoiceId: string; invoiceReferenceMonth: string; invoiceDueDate: string; }
export interface FinancialCreditCardPurchase { id: string; creditCardId: string; creditCardName: string; categoryId: string | null; categoryName: string | null; recurrenceId: string | null; recurrenceSequence: number | null; description: string; totalAmount: number; purchaseType: FinancialCreditCardPurchaseType; purchaseDate: string; totalInstallments: number; status: FinancialCreditCardPurchaseStatus; notes: string | null; createdByName: string; installments: FinancialCreditCardInstallment[]; createdAt: string; updatedAt: string; }
export interface FinancialCardPurchaseFilters { from: string; to: string; }
export interface FinancialCreditCardInvoice { id: string; creditCardId: string; creditCardName: string; referenceMonth: string; closingDate: string; dueDate: string; status: FinancialCreditCardInvoiceStatus; totalAmount: number; paidAt: string | null; installments: FinancialCreditCardInstallment[]; createdAt: string; updatedAt: string; }
export interface PayFinancialInvoiceRequest { accountId: string; paymentDate: string; paymentMethod: FinancialPaymentMethod; }

export interface CreateFinancialInvestmentRequest { name: string; institution: string; modality: FinancialInvestmentModality; startDate: string; initialAmount: number; maturityDate: string | null; liquidity: string | null; benchmarkPercentage: number | null; annualFixedRate: number | null; annualSpreadRate: number | null; taxExempt: boolean; autoCalculate: boolean; accrualStartRule: FinancialInvestmentAccrualStartRule; notes: string | null; }
export interface InvestmentTransferRequest { accountId: string; amount: number; date: string; notes: string | null; }
export interface ReconcileInvestmentRequest { realBalance: number; referenceDate: string; notes: string | null; }
export interface FinancialInvestmentMovement { id: string; movementType: FinancialInvestmentMovementType; movementDate: string; amount: number; balanceAfter: number; notes: string | null; }
export interface FinancialInvestment { id: string; accountId: string; name: string; institution: string; modality: FinancialInvestmentModality; benchmarkPercentage: number | null; annualFixedRate: number | null; annualSpreadRate: number | null; currentBalance: number; totalContributed: number; totalRedeemed: number; accumulatedYield: number; accumulatedReturnPercentage: number; valuationStatus: FinancialInvestmentValuationStatus; lastUpdatedAt: string | null; taxExempt: boolean; autoCalculate: boolean; movements: FinancialInvestmentMovement[]; }

export type FinanceSection = "overview" | "transactions" | "accounts" | "categories" | "budgets" | "recurrences" | "credit-cards" | "investments";
