"use client";

import {
  BellRing,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Inbox,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { NotificationCard } from "@/features/notifications/notification-card";
import { NotificationFilters } from "@/features/notifications/notification-filters";
import { NotificationPreferences } from "@/features/notifications/notification-preferences";
import {
  notificationPreferenceService,
  notificationService,
} from "@/features/notifications/notification-service";
import { NotificationSummary } from "@/features/notifications/notification-summary";
import { confirmDialog } from "@/lib/feedback";

import type {
  NotificationItem,
  NotificationPreference,
  NotificationSummary as NotificationSummaryData,
  PageResponse,
  UpdateNotificationPreferenceRequest,
} from "@/types/notification";

const PAGE_SIZE = 10;

function getErrorMessage(
  exception: unknown,
  fallback: string,
): string {
  if (exception instanceof Error) {
    return exception.message;
  }

  return fallback;
}

function NotificationListLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map(
        (_, index) => (
          <div
            key={index}
            className={[
              "h-48 animate-pulse",
              "rounded-3xl border",
              "border-white/10",
              "bg-white/[0.025]",
            ].join(" ")}
          />
        ),
      )}
    </div>
  );
}

interface EmptyNotificationsProps {
  unreadOnly: boolean;
}

function EmptyNotifications({
  unreadOnly,
}: EmptyNotificationsProps) {
  return (
    <div
      className={[
        "flex min-h-72 flex-col",
        "items-center justify-center",
        "rounded-3xl border",
        "border-dashed border-white/10",
        "bg-white/[0.018]",
        "px-6 py-12 text-center",
      ].join(" ")}
    >
      <div
        className={[
          "flex size-14 items-center",
          "justify-center rounded-2xl",
          "border border-white/10",
          "bg-white/[0.04]",
          "text-zinc-500",
        ].join(" ")}
      >
        <Inbox
          aria-hidden="true"
          className="size-6"
        />
      </div>

      <h2 className="mt-5 text-lg font-semibold text-white">
        {unreadOnly
          ? "Tudo em dia"
          : "Nenhuma notificação"}
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        {unreadOnly
          ? "Você não possui notificações pendentes de leitura."
          : "As atualizações importantes da sua família aparecerão aqui."}
      </p>
    </div>
  );
}

export function NotificationsPage() {
  const router = useRouter();

  const [
    notificationsPage,
    setNotificationsPage,
  ] =
    useState<
      PageResponse<NotificationItem> | null
    >(null);

  const [summary, setSummary] =
    useState<NotificationSummaryData>({
      unreadCount: 0,
    });

  const [
    totalNotifications,
    setTotalNotifications,
  ] = useState(0);

  const [preference, setPreference] =
    useState<NotificationPreference | null>(
      null,
    );

  const [unreadOnly, setUnreadOnly] =
    useState(false);

  const [pageNumber, setPageNumber] =
    useState(0);

  const [
    loadingNotifications,
    setLoadingNotifications,
  ] = useState(true);

  const [
    loadingPreferences,
    setLoadingPreferences,
  ] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [bulkBusy, setBulkBusy] =
    useState(false);

  const [busyNotificationId, setBusyNotificationId] =
    useState<string | null>(null);

  const [notificationError, setNotificationError] =
    useState<string | null>(null);

  const [preferenceError, setPreferenceError] =
    useState<string | null>(null);

  const loadNotificationData =
    useCallback(async () => {
      setLoadingNotifications(true);
      setNotificationError(null);

      try {
        const totalRequest = unreadOnly
          ? notificationService.list({
              unreadOnly: false,
              page: 0,
              size: 1,
              sort: "createdAt,desc",
            })
          : Promise.resolve(null);

        const [
          pageResult,
          summaryResult,
          totalResult,
        ] = await Promise.all([
          notificationService.list({
            unreadOnly,
            page: pageNumber,
            size: PAGE_SIZE,
            sort: "createdAt,desc",
          }),
          notificationService.summary(),
          totalRequest,
        ]);

        setNotificationsPage(pageResult);
        setSummary(summaryResult);

        setTotalNotifications(
          totalResult?.totalElements ??
            pageResult.totalElements,
        );
      } catch (exception) {
        setNotificationError(
          getErrorMessage(
            exception,
            "Não foi possível carregar as notificações.",
          ),
        );
      } finally {
        setLoadingNotifications(false);
      }
    }, [pageNumber, unreadOnly]);

  const loadPreferences =
    useCallback(async () => {
      setLoadingPreferences(true);
      setPreferenceError(null);

      try {
        const result =
          await notificationPreferenceService.get();

        setPreference(result);
      } catch (exception) {
        setPreferenceError(
          getErrorMessage(
            exception,
            "Não foi possível carregar as preferências.",
          ),
        );
      } finally {
        setLoadingPreferences(false);
      }
    }, []);

  useEffect(() => {
    void loadNotificationData();
  }, [loadNotificationData]);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  function handleFilterChange(
    nextUnreadOnly: boolean,
  ) {
    if (nextUnreadOnly === unreadOnly) {
      return;
    }

    setUnreadOnly(nextUnreadOnly);
    setPageNumber(0);
  }

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await Promise.all([
        loadNotificationData(),
        loadPreferences(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleToggleRead(
    notification: NotificationItem,
  ) {
    setBusyNotificationId(notification.id);
    setNotificationError(null);

    try {
      if (notification.read) {
        await notificationService.markAsUnread(
          notification.id,
        );
      } else {
        await notificationService.markAsRead(
          notification.id,
        );
      }

      await loadNotificationData();
    } catch (exception) {
      setNotificationError(
        getErrorMessage(
          exception,
          "Não foi possível atualizar a notificação.",
        ),
      );
    } finally {
      setBusyNotificationId(null);
    }
  }

  async function handleOpen(
    notification: NotificationItem,
  ) {
    if (!notification.actionPath) {
      return;
    }

    setBusyNotificationId(notification.id);
    setNotificationError(null);

    try {
      if (!notification.read) {
        await notificationService.markAsRead(
          notification.id,
        );
      }

      router.push(notification.actionPath);
    } catch (exception) {
      setNotificationError(
        getErrorMessage(
          exception,
          "Não foi possível abrir esta notificação.",
        ),
      );

      setBusyNotificationId(null);
    }
  }

  async function handleDelete(
    notification: NotificationItem,
  ) {
    const confirmed = await confirmDialog({
      title: "Excluir notificação",
      description: `Deseja excluir a notificação "${notification.title}"?`,
      confirmLabel: "Excluir",
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    setBusyNotificationId(notification.id);
    setNotificationError(null);

    try {
      await notificationService.remove(
        notification.id,
      );

      const isLastItemOnPage =
        notificationsPage?.content.length === 1;

      if (isLastItemOnPage && pageNumber > 0) {
        setPageNumber(
          (currentPage) => currentPage - 1,
        );
      } else {
        await loadNotificationData();
      }
    } catch (exception) {
      setNotificationError(
        getErrorMessage(
          exception,
          "Não foi possível excluir a notificação.",
        ),
      );
    } finally {
      setBusyNotificationId(null);
    }
  }

  async function handleMarkAllAsRead() {
    if (summary.unreadCount === 0) {
      return;
    }

    setBulkBusy(true);
    setNotificationError(null);

    try {
      const updatedSummary =
        await notificationService.markAllAsRead();

      setSummary(updatedSummary);

      if (pageNumber !== 0) {
        setPageNumber(0);
      } else {
        await loadNotificationData();
      }
    } catch (exception) {
      setNotificationError(
        getErrorMessage(
          exception,
          "Não foi possível marcar todas como lidas.",
        ),
      );
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleSavePreferences(
    request: UpdateNotificationPreferenceRequest,
  ) {
    setPreferenceError(null);

    try {
      const updatedPreference =
        await notificationPreferenceService.update(
          request,
        );

      setPreference(updatedPreference);
    } catch (exception) {
      const message = getErrorMessage(
        exception,
        "Não foi possível salvar as preferências.",
      );

      setPreferenceError(message);

      throw new Error(message);
    }
  }

  const notifications =
    notificationsPage?.content ?? [];

  const totalPages =
    notificationsPage?.totalPages ?? 0;

  const currentPage =
    notificationsPage?.number ?? pageNumber;

  const canGoBack =
    !loadingNotifications && currentPage > 0;

  const canGoForward =
    !loadingNotifications &&
    notificationsPage !== null &&
    !notificationsPage.last;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header
        className={[
          "flex flex-col gap-5",
          "sm:flex-row sm:items-end",
          "sm:justify-between",
        ].join(" ")}
      >
        <div>
          <div
            className={[
              "inline-flex items-center gap-2",
              "rounded-full border",
              "border-white/10",
              "bg-white/[0.035]",
              "px-3 py-1.5",
              "text-xs font-medium",
              "text-zinc-400",
            ].join(" ")}
          >
            <BellRing
              aria-hidden="true"
              className="size-3.5"
            />

            Central de notificações
          </div>

          <h1
            className={[
              "mt-4 text-3xl font-semibold",
              "tracking-tight text-white",
              "sm:text-4xl",
            ].join(" ")}
          >
            Notificações
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
            Acompanhe tudo o que acontece no seu
            núcleo familiar em um só lugar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={
              refreshing ||
              loadingNotifications
            }
            onClick={handleRefresh}
            className={[
              "inline-flex min-h-11",
              "items-center justify-center",
              "gap-2 rounded-full border",
              "border-white/10",
              "bg-white/[0.035]",
              "px-4 py-2.5",
              "text-sm font-medium",
              "text-zinc-300 transition",
              "hover:border-white/20",
              "hover:bg-white/[0.07]",
              "hover:text-white",
              "disabled:cursor-not-allowed",
              "disabled:opacity-50",
            ].join(" ")}
          >
            <RefreshCw
              aria-hidden="true"
              className={[
                "size-4",
                refreshing
                  ? "animate-spin"
                  : "",
              ].join(" ")}
            />

            Atualizar
          </button>

          <button
            type="button"
            disabled={
              bulkBusy ||
              loadingNotifications ||
              summary.unreadCount === 0
            }
            onClick={handleMarkAllAsRead}
            className={[
              "inline-flex min-h-11",
              "items-center justify-center",
              "gap-2 rounded-full",
              "bg-white px-4 py-2.5",
              "text-sm font-semibold",
              "text-black transition",
              "hover:bg-zinc-200",
              "disabled:cursor-not-allowed",
              "disabled:opacity-50",
            ].join(" ")}
          >
            {bulkBusy ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : (
              <CheckCheck
                aria-hidden="true"
                className="size-4"
              />
            )}

            Marcar todas como lidas
          </button>
        </div>
      </header>

      <div className="mt-7">
        <NotificationSummary
          unreadCount={summary.unreadCount}
          totalElements={totalNotifications}
          loading={loadingNotifications}
        />
      </div>

      <div
        className={[
          "mt-7 grid items-start gap-6",
          "lg:grid-cols-[minmax(0,1fr)_360px]",
        ].join(" ")}
      >
        <section className="min-w-0">
          <div
            className={[
              "flex flex-col gap-3",
              "sm:flex-row sm:items-center",
              "sm:justify-between",
            ].join(" ")}
          >
            <NotificationFilters
              unreadOnly={unreadOnly}
              disabled={loadingNotifications}
              onUnreadOnlyChange={
                handleFilterChange
              }
            />

            {!loadingNotifications &&
              notificationsPage && (
                <p className="text-xs text-zinc-600">
                  {notificationsPage.totalElements.toLocaleString(
                    "pt-BR",
                  )}{" "}
                  {notificationsPage.totalElements === 1
                    ? "notificação"
                    : "notificações"}
                </p>
              )}
          </div>

          {notificationError && (
            <div
              role="alert"
              className={[
                "mt-4 rounded-2xl border",
                "border-red-400/20",
                "bg-red-400/[0.07]",
                "px-4 py-3",
                "text-sm text-red-200",
              ].join(" ")}
            >
              {notificationError}
            </div>
          )}

          <div className="mt-4">
            {loadingNotifications ? (
              <NotificationListLoading />
            ) : notifications.length === 0 ? (
              <EmptyNotifications
                unreadOnly={unreadOnly}
              />
            ) : (
              <div className="space-y-3">
                {notifications.map(
                  (notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={
                        notification
                      }
                      busy={
                        busyNotificationId ===
                        notification.id
                      }
                      onOpen={handleOpen}
                      onToggleRead={
                        handleToggleRead
                      }
                      onDelete={handleDelete}
                    />
                  ),
                )}
              </div>
            )}
          </div>

          {!loadingNotifications &&
            totalPages > 1 && (
              <nav
                className={[
                  "mt-5 flex items-center",
                  "justify-between gap-3",
                  "rounded-2xl border",
                  "border-white/10",
                  "bg-white/[0.025] p-2",
                ].join(" ")}
                aria-label="Paginação das notificações"
              >
                <button
                  type="button"
                  disabled={!canGoBack}
                  onClick={() =>
                    setPageNumber(
                      (page) =>
                        Math.max(page - 1, 0),
                    )
                  }
                  className={[
                    "inline-flex min-h-10",
                    "items-center gap-2",
                    "rounded-xl px-3 py-2",
                    "text-sm font-medium",
                    "text-zinc-400 transition",
                    "hover:bg-white/[0.06]",
                    "hover:text-white",
                    "disabled:cursor-not-allowed",
                    "disabled:opacity-30",
                  ].join(" ")}
                >
                  <ChevronLeft
                    aria-hidden="true"
                    className="size-4"
                  />

                  Anterior
                </button>

                <p className="text-xs text-zinc-500">
                  Página{" "}
                  <span className="font-medium text-zinc-300">
                    {currentPage + 1}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium text-zinc-300">
                    {Math.max(totalPages, 1)}
                  </span>
                </p>

                <button
                  type="button"
                  disabled={!canGoForward}
                  onClick={() =>
                    setPageNumber(
                      (page) => page + 1,
                    )
                  }
                  className={[
                    "inline-flex min-h-10",
                    "items-center gap-2",
                    "rounded-xl px-3 py-2",
                    "text-sm font-medium",
                    "text-zinc-400 transition",
                    "hover:bg-white/[0.06]",
                    "hover:text-white",
                    "disabled:cursor-not-allowed",
                    "disabled:opacity-30",
                  ].join(" ")}
                >
                  Próxima

                  <ChevronRight
                    aria-hidden="true"
                    className="size-4"
                  />
                </button>
              </nav>
            )}
        </section>

        <aside className="lg:sticky lg:top-6">
          {preferenceError && (
            <div
              role="alert"
              className={[
                "mb-3 rounded-2xl border",
                "border-red-400/20",
                "bg-red-400/[0.07]",
                "px-4 py-3",
                "text-sm text-red-200",
              ].join(" ")}
            >
              {preferenceError}
            </div>
          )}

          <NotificationPreferences
            preference={preference}
            loading={loadingPreferences}
            onSave={handleSavePreferences}
          />
        </aside>
      </div>
    </main>
  );
}
