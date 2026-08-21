"use client";

import {
  addMonths,
  agendaPeriod,
  formatDateInput,
} from "@/features/agenda/agenda-date-utils";
import { apiRequest } from "@/lib/api/api-client";
import { getErrorMessage } from "@/lib/api/api-error";
import type {
  DashboardAgendaOccurrence,
} from "@/types/dashboard";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

interface UseDashboardCalendarResult {
  selectedDate: string;
  visibleDate: string;
  occurrences:
    DashboardAgendaOccurrence[];
  selectedOccurrences:
    DashboardAgendaOccurrence[];
  loading: boolean;
  error: string | null;
  selectDate: (date: string) => void;
  previousMonth: () => void;
  nextMonth: () => void;
  goToToday: () => void;
  refresh: () => Promise<void>;
}

function occurrenceDate(
  occurrence:
    DashboardAgendaOccurrence,
): string {
  return formatDateInput(
    new Date(occurrence.startsAt),
  );
}

export function useDashboardCalendar(
  initialOccurrences:
    DashboardAgendaOccurrence[] = [],
  enabled = true,
): UseDashboardCalendarResult {
  const today =
    formatDateInput(new Date());

  const [selectedDate, setSelectedDate] =
    useState(today);

  const [visibleDate, setVisibleDate] =
    useState(today);

  const [occurrences, setOccurrences] =
    useState<
      DashboardAgendaOccurrence[]
    >(initialOccurrences);

  const [loading, setLoading] =
    useState(enabled);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const period = agendaPeriod(
        visibleDate,
        "month",
      );

      const query =
        new URLSearchParams({
          from: period.from,
          to: period.to,
        });

      const response =
        await apiRequest<
          DashboardAgendaOccurrence[]
        >(
          `/api/agenda/occurrences?${query}`,
        );

      setOccurrences(
        response
          .filter(
            (occurrence) =>
              occurrence.status !==
              "CANCELLED",
          )
          .sort(
            (left, right) =>
              new Date(
                left.startsAt,
              ).getTime() -
              new Date(
                right.startsAt,
              ).getTime(),
          ),
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError),
      );
    } finally {
      setLoading(false);
    }
  }, [
    enabled,
    visibleDate,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedOccurrences =
    useMemo(
      () =>
        occurrences.filter(
          (occurrence) =>
            occurrenceDate(
              occurrence,
            ) === selectedDate,
        ),
      [
        occurrences,
        selectedDate,
      ],
    );

  const selectDate =
    useCallback((date: string) => {
      setSelectedDate(date);

      const selected =
        date.slice(0, 7);

      const visible =
        visibleDate.slice(0, 7);

      if (selected !== visible) {
        setVisibleDate(date);
      }
    }, [visibleDate]);

  const previousMonth =
    useCallback(() => {
      const previous = addMonths(
        visibleDate,
        -1,
      );

      setVisibleDate(previous);
      setSelectedDate(previous);
    }, [visibleDate]);

  const nextMonth =
    useCallback(() => {
      const next = addMonths(
        visibleDate,
        1,
      );

      setVisibleDate(next);
      setSelectedDate(next);
    }, [visibleDate]);

  const goToToday =
    useCallback(() => {
      const current =
        formatDateInput(new Date());

      setVisibleDate(current);
      setSelectedDate(current);
    }, []);

  return {
    selectedDate,
    visibleDate,
    occurrences,
    selectedOccurrences,
    loading,
    error,
    selectDate,
    previousMonth,
    nextMonth,
    goToToday,
    refresh: load,
  };
}