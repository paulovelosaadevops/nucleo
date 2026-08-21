export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "ACTIVATE"
  | "DEACTIVATE"
  | "COMPLETE"
  | "CLOSE"
  | "REOPEN"
  | "CANCEL"
  | "RESTORE"
  | "MARK_AS_PAID"
  | "MARK_AS_PENDING"
  | "REVERSE_PAYMENT"
  | "LOGIN"
  | "LOGOUT"
  | "REFRESH_TOKEN"
  | "INVITE"
  | "ACCEPT_INVITATION"
  | "DECLINE_INVITATION"
  | "REVOKE_INVITATION"
  | "CHANGE_ROLE"
  | "MARK_AS_READ"
  | "MARK_AS_UNREAD"
  | "MARK_ALL_AS_READ"
  | "SYSTEM_GENERATION";

export type AuditResourceType =
  | "USER"
  | "FAMILY"
  | "FAMILY_MEMBERSHIP"
  | "FAMILY_INVITATION"
  | "AGENDA_EVENT"
  | "AGENDA_OCCURRENCE"
  | "SHOPPING_LIST"
  | "SHOPPING_ITEM"
  | "FINANCIAL_ACCOUNT"
  | "FINANCIAL_CATEGORY"
  | "FINANCIAL_TRANSACTION"
  | "FINANCIAL_RECURRENCE"
  | "FINANCIAL_BUDGET"
  | "FINANCIAL_CREDIT_CARD"
  | "FINANCIAL_CREDIT_CARD_PURCHASE"
  | "FINANCIAL_CREDIT_CARD_INVOICE"
  | "NOTIFICATION"
  | "NOTIFICATION_PREFERENCE"
  | "SYSTEM";

export interface AuditEvent {
  id: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string | null;
  description: string;
  metadataJson: string | null;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: string;
}

export interface AuditSearchParams {
  actorUserId?: string;
  action?: AuditAction;
  resourceType?: AuditResourceType;
  resourceId?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface AuditPageResponse<T> {
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