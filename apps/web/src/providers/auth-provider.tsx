"use client";

import { apiRequest } from "@/lib/api/api-client";
import {
  clearStoredSession,
  getStoredSession,
  saveStoredSession,
  SESSION_CHANGED_EVENT,
} from "@/lib/auth/session-storage";
import type {
  AuthSession,
  LoginRequest,
  LogoutRequest,
  RegisterRequest,
  RegisterResponse,
} from "@/types/auth";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    request: LoginRequest,
  ) => Promise<AuthSession>;
  register: (
    request: RegisterRequest,
  ) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  refreshSession: () => void;
}

export const AuthContext =
  createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [session, setSession] =
    useState<AuthSession | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const refreshSession = useCallback(() => {
    setSession(getStoredSession());
  }, []);

  useEffect(() => {
    refreshSession();
    setIsLoading(false);

    const handleStorage = () => {
      refreshSession();
    };

    window.addEventListener(
      "storage",
      handleStorage,
    );

    window.addEventListener(
      SESSION_CHANGED_EVENT,
      handleStorage,
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage,
      );

      window.removeEventListener(
        SESSION_CHANGED_EVENT,
        handleStorage,
      );
    };
  }, [refreshSession]);

  const login = useCallback(
    async (
      request: LoginRequest,
    ): Promise<AuthSession> => {
      const authenticatedSession =
        await apiRequest<AuthSession>(
          "/api/auth/login",
          {
            method: "POST",
            authenticated: false,
            retryOnUnauthorized: false,
            body: request,
          },
        );

      saveStoredSession(authenticatedSession);
      setSession(authenticatedSession);

      return authenticatedSession;
    },
    [],
  );

  const register = useCallback(
    async (
      request: RegisterRequest,
    ): Promise<RegisterResponse> => {
      const registration =
        await apiRequest<RegisterResponse>(
          "/api/auth/register",
          {
            method: "POST",
            authenticated: false,
            retryOnUnauthorized: false,
            body: request,
          },
        );

      await login({
        email: request.email,
        password: request.password,
      });

      return registration;
    },
    [login],
  );

  const logout = useCallback(async () => {
    const currentSession = getStoredSession();

    try {
      if (currentSession?.refreshToken) {
        const request: LogoutRequest = {
          refreshToken:
            currentSession.refreshToken,
        };

        await apiRequest<void>(
          "/api/auth/logout",
          {
            method: "POST",
            body: request,
            retryOnUnauthorized: false,
          },
        );
      }
    } finally {
      clearStoredSession();
      setSession(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      isLoading,
      login,
      register,
      logout,
      refreshSession,
    }),
    [
      session,
      isLoading,
      login,
      register,
      logout,
      refreshSession,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}