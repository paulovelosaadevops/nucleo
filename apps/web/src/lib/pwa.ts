const iosSafariPattern = /iPad|iPhone|iPod/;
const safariPattern =
  /^((?!CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Android).)*Safari/i;

export const pwaDismissalStorageKey =
  "nucleo:pwa-install-dismissed-at";

export const pwaDismissalIntervalMs =
  1000 * 60 * 60 * 24 * 14;

export function isStandaloneDisplay(
  matchMedia: Pick<Window, "matchMedia">["matchMedia"],
  navigatorStandalone?: boolean,
) {
  return (
    matchMedia("(display-mode: standalone)").matches ||
    navigatorStandalone === true
  );
}

export function isIosSafari(userAgent: string) {
  return (
    iosSafariPattern.test(userAgent) &&
    safariPattern.test(userAgent)
  );
}

export function wasRecentlyDismissed(
  dismissedAt: string | null,
  now = Date.now(),
) {
  if (!dismissedAt) {
    return false;
  }

  const timestamp = Number(dismissedAt);

  return (
    Number.isFinite(timestamp) &&
    now - timestamp < pwaDismissalIntervalMs
  );
}

export function shouldShowIosInstallGuide({
  userAgent,
  standalone,
  dismissedAt,
  now,
}: {
  userAgent: string;
  standalone: boolean;
  dismissedAt: string | null;
  now?: number;
}) {
  return (
    isIosSafari(userAgent) &&
    !standalone &&
    !wasRecentlyDismissed(dismissedAt, now)
  );
}

export function isPrivateOrMutableRequest(
  request: Request,
) {
  const url = new URL(request.url);

  return (
    request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/cadastro") ||
    request.headers.has("authorization")
  );
}
