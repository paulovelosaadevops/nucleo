import {
  describe,
  expect,
  it,
} from "vitest";

import {
  isIosSafari,
  isPrivateOrMutableRequest,
  isStandaloneDisplay,
  pwaDismissalIntervalMs,
  shouldShowIosInstallGuide,
  wasRecentlyDismissed,
} from "./pwa";

describe("PWA helpers", () => {
  it("detects iOS Safari without matching Chromium iOS", () => {
    expect(
      isIosSafari(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(true);

    expect(
      isIosSafari(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/128.0.0.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(false);
  });

  it("uses display-mode or navigator standalone", () => {
    expect(
      isStandaloneDisplay(
        () =>
          ({
            matches: true,
          }) as MediaQueryList,
        false,
      ),
    ).toBe(true);

    expect(
      isStandaloneDisplay(
        () =>
          ({
            matches: false,
          }) as MediaQueryList,
        true,
      ),
    ).toBe(true);
  });

  it("respects dismissed install guidance window", () => {
    const now = 10_000_000;

    expect(
      wasRecentlyDismissed(String(now - 1000), now),
    ).toBe(true);

    expect(
      wasRecentlyDismissed(
        String(
          now - pwaDismissalIntervalMs - 1000,
        ),
        now,
      ),
    ).toBe(false);
  });

  it("shows iOS install guidance only when useful", () => {
    const userAgent =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

    expect(
      shouldShowIosInstallGuide({
        userAgent,
        standalone: false,
        dismissedAt: null,
      }),
    ).toBe(true);

    expect(
      shouldShowIosInstallGuide({
        userAgent,
        standalone: true,
        dismissedAt: null,
      }),
    ).toBe(false);
  });

  it("keeps API and authenticated requests out of persistent cache", () => {
    expect(
      isPrivateOrMutableRequest(
        new Request(
          "https://nucleo.example/api/finance",
        ),
      ),
    ).toBe(true);

    expect(
      isPrivateOrMutableRequest(
        new Request(
          "https://nucleo.example/_next/static/app.js",
          {
            headers: {
              authorization: "Bearer token",
            },
          },
        ),
      ),
    ).toBe(true);

    expect(
      isPrivateOrMutableRequest(
        new Request(
          "https://nucleo.example/api/finance",
          {
            method: "POST",
          },
        ),
      ),
    ).toBe(true);
  });
});
