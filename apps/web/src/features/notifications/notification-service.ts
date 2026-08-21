import { apiRequest } from "@/lib/api/api-client";

import type {
  NotificationItem,
  NotificationListParams,
  NotificationPreference,
  NotificationSummary,
  PageResponse,
  UpdateNotificationPreferenceRequest,
} from "@/types/notification";

const NOTIFICATIONS_PATH = "/api/notifications";

const PREFERENCES_PATH =
  "/api/notification-preferences";

function buildNotificationQuery(
  params: NotificationListParams = {},
): string {
  const query = new URLSearchParams();

  query.set(
    "unreadOnly",
    String(params.unreadOnly ?? false),
  );

  query.set(
    "page",
    String(params.page ?? 0),
  );

  query.set(
    "size",
    String(params.size ?? 20),
  );

  query.set(
    "sort",
    params.sort ?? "createdAt,desc",
  );

  return query.toString();
}

export const notificationService = {
  list(
    params: NotificationListParams = {},
  ): Promise<PageResponse<NotificationItem>> {
    const query = buildNotificationQuery(params);

    return apiRequest<
      PageResponse<NotificationItem>
    >(`${NOTIFICATIONS_PATH}?${query}`);
  },

  summary(): Promise<NotificationSummary> {
    return apiRequest<NotificationSummary>(
      `${NOTIFICATIONS_PATH}/summary`,
    );
  },

  markAsRead(
    notificationId: string,
  ): Promise<NotificationItem> {
    return apiRequest<NotificationItem>(
      `${NOTIFICATIONS_PATH}/${notificationId}/read`,
      {
        method: "PATCH",
      },
    );
  },

  markAsUnread(
    notificationId: string,
  ): Promise<NotificationItem> {
    return apiRequest<NotificationItem>(
      `${NOTIFICATIONS_PATH}/${notificationId}/unread`,
      {
        method: "PATCH",
      },
    );
  },

  markAllAsRead(): Promise<NotificationSummary> {
    return apiRequest<NotificationSummary>(
      `${NOTIFICATIONS_PATH}/read-all`,
      {
        method: "PATCH",
      },
    );
  },

  remove(notificationId: string): Promise<void> {
    return apiRequest<void>(
      `${NOTIFICATIONS_PATH}/${notificationId}`,
      {
        method: "DELETE",
      },
    );
  },
};

export const notificationPreferenceService = {
  get(): Promise<NotificationPreference> {
    return apiRequest<NotificationPreference>(
      PREFERENCES_PATH,
    );
  },

  update(
    request: UpdateNotificationPreferenceRequest,
  ): Promise<NotificationPreference> {
    return apiRequest<NotificationPreference>(
      PREFERENCES_PATH,
      {
        method: "PUT",
        body: request,
      },
    );
  },
};