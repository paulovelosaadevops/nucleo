"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearSession,
  getAccessToken,
  getCurrentUser,
  saveCurrentUser,
} from "@/lib/session";
import { userService } from "@/services/userService";
import type { CurrentUser } from "@/types/user";

export function useCurrentUser() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const cachedUser = getCurrentUser();
    const token = getAccessToken();

    if (cachedUser) {
      setUser(cachedUser);
    }

    if (!token) {
      setIsLoadingUser(false);
      return;
    }

    userService
      .me(token)
      .then((freshUser) => {
        saveCurrentUser(freshUser);
        setUser(freshUser);
      })
      .catch(() => {
        clearSession();
        router.replace("/login");
      })
      .finally(() => {
        setIsLoadingUser(false);
      });
  }, [router]);

  return {
    user,
    isLoadingUser,
  };
}
