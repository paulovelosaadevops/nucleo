import { apiRequest } from "@/lib/api/api-client";
import type {
  DashboardAgendaOccurrence,
  DashboardData,
  DashboardFinance,
  DashboardSection,
  DashboardShoppingList,
  NotificationSummary,
} from "@/types/dashboard";

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function agendaPeriod() {
  const from = new Date();
  from.setSeconds(0, 0);

  const to = new Date(from);
  to.setDate(to.getDate() + 7);
  to.setHours(23, 59, 59, 999);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

function financePeriod() {
  const today = new Date();

  const from = new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  );

  const to = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  );

  return {
    from: formatLocalDate(from),
    to: formatLocalDate(to),
  };
}

function fulfilledValue<T>(
  result: PromiseSettledResult<T>,
  fallback: T,
): T {
  return result.status === "fulfilled"
    ? result.value
    : fallback;
}

export async function loadDashboard(): Promise<DashboardData> {
  const agenda = agendaPeriod();
  const finance = financePeriod();

  const agendaQuery = new URLSearchParams({
    from: agenda.from,
    to: agenda.to,
  });

  const financeQuery = new URLSearchParams({
    from: finance.from,
    to: finance.to,
  });

  const results = await Promise.allSettled([
    apiRequest<DashboardAgendaOccurrence[]>(
      `/api/agenda/occurrences?${agendaQuery}`,
    ),
    apiRequest<DashboardShoppingList[]>(
      "/api/shopping/lists",
    ),
    apiRequest<DashboardFinance>(
      `/api/finance/dashboard?${financeQuery}`,
    ),
    apiRequest<NotificationSummary>(
      "/api/notifications/summary",
    ),
  ]);

  const [
    agendaResult,
    shoppingResult,
    financeResult,
    notificationResult,
  ] = results;

  const unavailableSections: DashboardSection[] = [];

  if (agendaResult.status === "rejected") {
    unavailableSections.push("agenda");
  }

  if (shoppingResult.status === "rejected") {
    unavailableSections.push("shopping");
  }

  if (financeResult.status === "rejected") {
    unavailableSections.push("finance");
  }

  if (notificationResult.status === "rejected") {
    unavailableSections.push("notifications");
  }

  const notificationSummary =
    fulfilledValue<NotificationSummary>(
      notificationResult,
      {},
    );

  const shoppingLists =
    fulfilledValue<DashboardShoppingList[]>(
      shoppingResult,
      [],
    )
      .filter(
        (list) =>
          list.status !== "ARCHIVED" &&
          list.status !== "COMPLETED",
      )
      .sort((left, right) => {
        if (!left.dueDate) {
          return 1;
        }

        if (!right.dueDate) {
          return -1;
        }

        return left.dueDate.localeCompare(
          right.dueDate,
        );
      });

  return {
    agenda:
      fulfilledValue<DashboardAgendaOccurrence[]>(
        agendaResult,
        [],
      )
        .filter(
          (occurrence) =>
            occurrence.status !== "CANCELLED",
        )
        .slice(0, 5),

    shoppingLists: shoppingLists.slice(0, 4),

    finance:
      fulfilledValue<DashboardFinance | null>(
        financeResult,
        null,
      ),

    unreadNotifications: Number(
      notificationSummary.unreadCount ??
        notificationSummary.totalUnread ??
        0,
    ),

    unavailableSections,
    loadedAt: new Date().toISOString(),
  };
}