"use client";

import { loadDashboard } from "@/features/dashboard/dashboard-service";
import { getErrorMessage } from "@/lib/api/api-error";
import type { DashboardData } from "@/types/dashboard";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

interface UseDashboardResult {
  data: DashboardData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDashboard(): UseDashboardResult {
  const [data, setData] =
    useState<DashboardData | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const fetchDashboard = useCallback(
    async (background: boolean) => {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const dashboard = await loadDashboard();
        setData(dashboard);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchDashboard(false);
  }, [fetchDashboard]);

  const refresh = useCallback(async () => {
    await fetchDashboard(true);
  }, [fetchDashboard]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh,
  };
}