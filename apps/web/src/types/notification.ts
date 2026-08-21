export type NotificationType =
  | "FAMILY_INVITATION"
  | "FAMILY_MEMBER_JOINED"
  | "FAMILY_ROLE_CHANGED"
  | "AGENDA_EVENT_CREATED"
  | "AGENDA_EVENT_UPDATED"
  | "AGENDA_REMINDER"
  | "SHOPPING_LIST_UPDATED"
  | "SHOPPING_ITEM_ADDED"
  | "FINANCIAL_BUDGET_ALERT"
  | "FINANCIAL_TRANSACTION_DUE"
  | "CREDIT_CARD_INVOICE_DUE"
  | "SYSTEM";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionPath: string | null;
  referenceId: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationSummary {
  unreadCount: number;
}

export interface NotificationPreference {
  id: string;
  familyId: string;
  userId: string;
  inAppEnabled: boolean;
  familyEnabled: boolean;
  agendaEnabled: boolean;
  shoppingEnabled: boolean;
  financeEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNotificationPreferenceRequest {
  inAppEnabled: boolean;
  familyEnabled: boolean;
  agendaEnabled: boolean;
  shoppingEnabled: boolean;
  financeEnabled: boolean;
}

export interface NotificationListParams {
  unreadOnly?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;

  pageable?: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };

  sort?: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
}