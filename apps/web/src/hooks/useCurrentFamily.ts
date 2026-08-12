"use client";

import { useEffect, useState } from "react";
import { clearSession, getAccessToken } from "@/lib/session";
import { familyService } from "@/services/familyService";
import type { CurrentFamily } from "@/types/family";

export function useCurrentFamily() {
  const [family, setFamily] = useState<CurrentFamily | null>(null);
  const [isLoadingFamily, setIsLoadingFamily] = useState(true);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setIsLoadingFamily(false);
      return;
    }

    familyService
      .current(token)
      .then(setFamily)
      .catch(() => {
        clearSession();
      })
      .finally(() => {
        setIsLoadingFamily(false);
      });
  }, []);

  return {
    family,
    isLoadingFamily,
  };
}
