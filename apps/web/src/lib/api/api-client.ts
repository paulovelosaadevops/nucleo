import { ApiError } from "@/lib/api/api-error";
import {
  clearStoredSession,
  getStoredSession,
  saveStoredSession,
} from "@/lib/auth/session-storage";
import type { ApiErrorPayload } from "@/types/api";
import type {
  AuthSession,
  RefreshRequest,
} from "@/types/auth";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8090"
).replace(/\/+$/, "");

interface ApiRequestOptions
  extends Omit<RequestInit, "body"> {
  body?: unknown;
  authenticated?: boolean;
  retryOnUnauthorized?: boolean;
}

let refreshPromise: Promise<AuthSession> | null = null;

function buildUrl(path: string): string {
  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${API_URL}${normalizedPath}`;
}

function prepareBody(
  body: unknown,
  headers: Headers,
): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob
  ) {
    return body;
  }

  if (!headers.has("Content-Type")) {
    headers.set(
      "Content-Type",
      "application/json; charset=utf-8",
    );
  }

  return JSON.stringify(body);
}

async function readResponseBody(
  response: Response,
): Promise<unknown> {
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return undefined;
  }

  const contentType =
    response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text || undefined;
}

function isApiErrorPayload(
  value: unknown,
): value is ApiErrorPayload {
  return Boolean(value && typeof value === "object");
}

async function refreshSession(): Promise<AuthSession> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = performRefresh();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function performRefresh(): Promise<AuthSession> {
  const currentSession = getStoredSession();

  if (!currentSession?.refreshToken) {
    clearStoredSession();

    throw new ApiError(
      "Sua sessão expirou. Entre novamente.",
      401,
    );
  }

  const request: RefreshRequest = {
    refreshToken: currentSession.refreshToken,
  };

  const response = await fetch(
    buildUrl("/api/auth/refresh"),
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
      },
      body: JSON.stringify(request),
      cache: "no-store",
    },
  );

  const payload = await readResponseBody(response);

  if (!response.ok) {
    clearStoredSession();

    throw ApiError.fromPayload(
      response.status,
      response.statusText,
      isApiErrorPayload(payload)
        ? payload
        : undefined,
    );
  }

  const renewedSession = payload as AuthSession;

  saveStoredSession(renewedSession);

  return renewedSession;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    body,
    authenticated = true,
    retryOnUnauthorized = true,
    headers: originalHeaders,
    ...requestOptions
  } = options;

  const headers = new Headers(originalHeaders);
  const session = getStoredSession();

  if (
    authenticated &&
    session?.accessToken &&
    !headers.has("Authorization")
  ) {
    headers.set(
      "Authorization",
      `Bearer ${session.accessToken}`,
    );
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const response = await fetch(buildUrl(path), {
    ...requestOptions,
    headers,
    body: prepareBody(body, headers),
    cache: requestOptions.cache ?? "no-store",
  });

  if (
    response.status === 401 &&
    authenticated &&
    retryOnUnauthorized
  ) {
    await refreshSession();

    return apiRequest<T>(path, {
      ...options,
      retryOnUnauthorized: false,
    });
  }

  const payload = await readResponseBody(response);

  if (!response.ok) {
    throw ApiError.fromPayload(
      response.status,
      response.statusText,
      isApiErrorPayload(payload)
        ? payload
        : undefined,
    );
  }

  return payload as T;
}