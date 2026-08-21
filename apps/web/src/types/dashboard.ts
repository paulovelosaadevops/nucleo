export interface AgendaAssignedMember {
  membershipId: string;
  userId: string;
  name: string;
}

export interface DashboardAgendaOccurrence {
  occurrenceId: string;
  eventId: string;
  title: string;
  category: string;
  location: string | null;
  allDay: boolean;
  startsAt: string;
  endsAt: string;
  status: string;
  assignedTo: AgendaAssignedMember | null;
}

export interface DashboardShoppingList {
  id: string;
  name: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  createdByName: string;
  totalItems: number;
  pendingItems: number;
  purchasedItems: number;
  cancelledItems: number;
  estimatedTotal: number;
  actualTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialCategorySummary {
  categoryId: string | null;
  categoryName: string;
  color: string | null;
  icon: string | null;
  amount: number;
  percentage: number;
}

export interface DashboardFinance {
  from: string;
  to: string;
  totalAccountBalance: number;
  totalIncome: number;
  totalExpense: number;
  periodBalance: number;
  pendingIncome: number;
  pendingExpense: number;
  overdueExpense: number;
  overdueTransactionCount: number;
  incomeByCategory: FinancialCategorySummary[];
  expenseByCategory: FinancialCategorySummary[];
}

export interface NotificationSummary {
  unreadCount?: number;
  totalUnread?: number;
  hasUnread?: boolean;
}

export type DashboardSection =
  | "agenda"
  | "shopping"
  | "finance"
  | "notifications";

export interface DashboardData {
  agenda: DashboardAgendaOccurrence[];
  shoppingLists: DashboardShoppingList[];
  finance: DashboardFinance | null;
  unreadNotifications: number;
  unavailableSections: DashboardSection[];
  loadedAt: string;
}