import type { AuthSession } from "@/types/auth";

const SESSION_STORAGE_KEY = "nucleo.auth.session";

export const SESSION_CHANGED_EVENT =
  "nucleo:session-changed";

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function isValidSession(
  value: unknown,
): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<AuthSession>;

  return Boolean(
    session.accessToken &&
      session.refreshToken &&
      session.user?.id &&
      session.family?.id,
  );
}

export function getStoredSession(): AuthSession | null {
  if (!canUseStorage()) {
    return null;
  }

  const rawSession =
    window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const session: unknown = JSON.parse(rawSession);

    if (!isValidSession(session)) {
      clearStoredSession();
      return null;
    }

    return session;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function saveStoredSession(
  session: AuthSession,
): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify(session),
  );

  window.dispatchEvent(
    new CustomEvent(SESSION_CHANGED_EVENT),
  );
}

export function clearStoredSession(): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);

  window.dispatchEvent(
    new CustomEvent(SESSION_CHANGED_EVENT),
  );
}