"use client";

import {
  cancelAgendaOccurrence,
  completeAgendaOccurrence,
  createAgendaEvent,
  deleteAgendaEventSeries,
  deleteAgendaOccurrence,
  duplicateAgendaOccurrence,
  getAgendaOccurrence,
  listAgendaOccurrences,
} from "@/features/agenda/agenda-service";
import { getErrorMessage } from "@/lib/api/api-error";
import type {
  AgendaOccurrenceActionRequest,
  AgendaOccurrenceDetails,
  AgendaOccurrenceSummary,
  CreateAgendaEventRequest,
  DuplicateAgendaEventRequest,
  OccurrenceStatus,
} from "@/types/agenda";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateFromInput(value: string): Date {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

function periodForDate(value: string) {
  const from = dateFromInput(value);
  from.setHours(0, 0, 0, 0);

  const to = dateFromInput(value);
  to.setHours(23, 59, 59, 999);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export function useAgenda() {
  const [selectedDate, setSelectedDate] =
    useState(() => formatDateInput(new Date()));

  const [statusFilter, setStatusFilter] =
    useState<OccurrenceStatus | undefined>();

  const [occurrences, setOccurrences] =
    useState<AgendaOccurrenceSummary[]>([]);

  const [selectedOccurrence, setSelectedOccurrence] =
    useState<AgendaOccurrenceDetails | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loadingDetails, setLoadingDetails] =
    useState(false);

  const [performingAction, setPerformingAction] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const period = periodForDate(selectedDate);

      const response =
        await listAgendaOccurrences({
          ...period,
          status: statusFilter,
        });

      setOccurrences(response);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [selectedDate, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openOccurrence = useCallback(
    async (occurrenceId: string) => {
      setLoadingDetails(true);
      setError(null);

      try {
        const response =
          await getAgendaOccurrence(
            occurrenceId,
          );

        setSelectedOccurrence(response);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoadingDetails(false);
      }
    },
    [],
  );

  const closeOccurrence = useCallback(() => {
    setSelectedOccurrence(null);
  }, []);

  const createEvent = useCallback(
    async (request: CreateAgendaEventRequest) => {
      setPerformingAction(true);
      setError(null);

      try {
        const response =
          await createAgendaEvent(request);

        await load();

        return response;
      } catch (requestError) {
        setError(getErrorMessage(requestError));
        throw requestError;
      } finally {
        setPerformingAction(false);
      }
    },
    [load],
  );

  const completeOccurrence = useCallback(
    async (
      occurrenceId: string,
      request: AgendaOccurrenceActionRequest = {},
    ) => {
      setPerformingAction(true);
      setError(null);

      try {
        await completeAgendaOccurrence(
          occurrenceId,
          request,
        );

        setSelectedOccurrence(null);
        await load();
      } catch (requestError) {
        setError(getErrorMessage(requestError));
        throw requestError;
      } finally {
        setPerformingAction(false);
      }
    },
    [load],
  );

  const cancelOccurrence = useCallback(
    async (
      occurrenceId: string,
      request: AgendaOccurrenceActionRequest = {},
    ) => {
      setPerformingAction(true);
      setError(null);

      try {
        await cancelAgendaOccurrence(
          occurrenceId,
          request,
        );

        setSelectedOccurrence(null);
        await load();
      } catch (requestError) {
        setError(getErrorMessage(requestError));
        throw requestError;
      } finally {
        setPerformingAction(false);
      }
    },
    [load],
  );

  const duplicateOccurrence = useCallback(
    async (
      occurrenceId: string,
      request?: DuplicateAgendaEventRequest,
    ) => {
      setPerformingAction(true);
      setError(null);

      try {
        const response =
          await duplicateAgendaOccurrence(
            occurrenceId,
            request,
          );

        setSelectedOccurrence(null);
        await load();

        return response;
      } catch (requestError) {
        setError(getErrorMessage(requestError));
        throw requestError;
      } finally {
        setPerformingAction(false);
      }
    },
    [load],
  );

  const removeOccurrence = useCallback(
    async (occurrenceId: string) => {
      setPerformingAction(true);
      setError(null);

      try {
        await deleteAgendaOccurrence(
          occurrenceId,
        );

        setSelectedOccurrence(null);
        await load();
      } catch (requestError) {
        setError(getErrorMessage(requestError));
        throw requestError;
      } finally {
        setPerformingAction(false);
      }
    },
    [load],
  );

  const removeEventSeries = useCallback(
    async (eventId: string) => {
      setPerformingAction(true);
      setError(null);

      try {
        await deleteAgendaEventSeries(eventId);

        setSelectedOccurrence(null);
        await load();
      } catch (requestError) {
        setError(getErrorMessage(requestError));
        throw requestError;
      } finally {
        setPerformingAction(false);
      }
    },
    [load],
  );

  return {
    selectedDate,
    setSelectedDate,
    statusFilter,
    setStatusFilter,
    occurrences,
    selectedOccurrence,
    loading,
    loadingDetails,
    performingAction,
    error,
    refresh: load,
    openOccurrence,
    closeOccurrence,
    createEvent,
    completeOccurrence,
    cancelOccurrence,
    duplicateOccurrence,
    removeOccurrence,
    removeEventSeries,
  };
}