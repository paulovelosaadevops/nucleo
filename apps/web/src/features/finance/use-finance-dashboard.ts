"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { financeService } from "./finance-service";

import type { FinancialDashboard } from "@/types/finance";

interface FinancePeriod {
  from: string;
  to: string;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createMonthPeriod(date: Date): FinancePeriod {
  const firstDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  );

  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  );

  return {
    from: formatLocalDate(firstDay),
    to: formatLocalDate(lastDay),
  };
}

export function useFinanceDashboard() {
  const [referenceDate, setReferenceDate] = useState(
    () => new Date(),
  );

  const [dashboard, setDashboard] =
    useState<FinancialDashboard | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const period = useMemo(
    () => createMonthPeriod(referenceDate),
    [referenceDate],
  );

  const periodLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric",
      }).format(referenceDate),
    [referenceDate],
  );

  const loadDashboard = useCallback(
    async (background = false) => {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const response = await financeService.dashboard.get(
          period.from,
          period.to,
        );

        setDashboard(response);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar o resumo financeiro.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period.from, period.to],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  function previousMonth() {
    setReferenceDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1,
        ),
    );
  }

  function nextMonth() {
    setReferenceDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1,
        ),
    );
  }

  function currentMonth() {
    setReferenceDate(new Date());
  }

  return {
    dashboard,
    error,
    loading,
    refreshing,
    period,
    periodLabel,
    previousMonth,
    nextMonth,
    currentMonth,
    refresh: () => loadDashboard(true),
  };
}