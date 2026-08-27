"use client";

import {
  isIosSafari,
  isStandaloneDisplay,
  pwaDismissalStorageKey,
  shouldShowIosInstallGuide,
} from "@/lib/pwa";
import {
  Download,
  RefreshCcw,
  WifiOff,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

type BeforeInstallPromptEvent = Event & {
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
  }>;
};

export function PwaExperience() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] =
    useState(false);
  const [updateWaiting, setUpdateWaiting] =
    useState<ServiceWorker | null>(null);
  const [isOffline, setIsOffline] =
    useState(
      () =>
        typeof navigator !== "undefined" &&
        !navigator.onLine,
    );
  const [canPromptInstall, setCanPromptInstall] =
    useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }

    function handleOffline() {
      setIsOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const standalone = isStandaloneDisplay(
      window.matchMedia.bind(window),
      (navigator as Navigator & {
        standalone?: boolean;
      }).standalone,
    );

    if (
      shouldShowIosInstallGuide({
        userAgent: navigator.userAgent,
        standalone,
        dismissedAt: localStorage.getItem(
          pwaDismissalStorageKey,
        ),
      })
    ) {
      const timer = window.setTimeout(() => {
        setShowIosGuide(true);
      }, 1600);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, []);

  useEffect(() => {
    function handleBeforeInstallPrompt(
      event: Event,
    ) {
      event.preventDefault();
      setInstallPrompt(
        event as BeforeInstallPromptEvent,
      );
      setCanPromptInstall(
        !isIosSafari(navigator.userAgent),
      );
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt,
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    let refreshing = false;

    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })
      .then((registration) => {
        if (registration.waiting) {
          setUpdateWaiting(registration.waiting);
        }

        registration.addEventListener(
          "updatefound",
          () => {
            const nextWorker =
              registration.installing;

            if (!nextWorker) {
              return;
            }

            nextWorker.addEventListener(
              "statechange",
              () => {
                if (
                  nextWorker.state ===
                    "installed" &&
                  navigator.serviceWorker
                    .controller
                ) {
                  setUpdateWaiting(nextWorker);
                }
              },
            );
          },
        );
      })
      .catch(() => {
        // Progressive enhancement: the app stays usable without SW support.
      });

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => {
        if (refreshing) {
          return;
        }

        refreshing = true;
        window.location.reload();
      },
    );
  }, []);

  const dismissInstallGuide = useCallback(() => {
    localStorage.setItem(
      pwaDismissalStorageKey,
      String(Date.now()),
    );
    setShowIosGuide(false);
    setInstallPrompt(null);
    setCanPromptInstall(false);
  }, []);

  const installApp = useCallback(async () => {
    if (!installPrompt) {
      return;
    }

    const requestInstall = Reflect.get(
      installPrompt,
      "prompt",
    ) as (() => Promise<void>) | undefined;

    await requestInstall?.call(installPrompt);
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setCanPromptInstall(false);
  }, [installPrompt]);

  const activateUpdate = useCallback(() => {
    updateWaiting?.postMessage({
      type: "SKIP_WAITING",
    });
  }, [updateWaiting]);

  return (
    <>
      {isOffline ? (
        <div
          role="status"
          className="
            fixed
            inset-x-4
            top-[calc(0.75rem+env(safe-area-inset-top))]
            z-[90]
            mx-auto
            flex
            max-w-xl
            items-center
            gap-3
            rounded-2xl
            border
            border-white/10
            bg-[#090909]/95
            px-4
            py-3
            text-sm
            text-zinc-200
            shadow-[0_18px_60px_rgba(0,0,0,0.55)]
            backdrop-blur-xl
          "
        >
          <WifiOff className="size-4 shrink-0 text-zinc-400" />
          <span>
            Você está sem conexão. Reconecte-se para acessar os dados atualizados do Núcleo.
          </span>
        </div>
      ) : null}

      {updateWaiting ? (
        <div
          role="status"
          className="
            fixed
            inset-x-4
            bottom-[calc(6.5rem+env(safe-area-inset-bottom))]
            z-[90]
            mx-auto
            flex
            max-w-lg
            flex-wrap
            items-center
            gap-3
            rounded-2xl
            border
            border-white/10
            bg-[#090909]/95
            p-3
            text-sm
            text-zinc-200
            shadow-[0_20px_70px_rgba(0,0,0,0.65)]
            backdrop-blur-xl
            lg:bottom-6
          "
        >
          <RefreshCcw className="size-4 shrink-0 text-zinc-400" />
          <span className="min-w-0 flex-1">
            Uma nova versão do Núcleo está disponível.
          </span>
          <button
            type="button"
            onClick={activateUpdate}
            className="
              rounded-xl
              bg-white
              px-3
              py-2
              text-xs
              font-semibold
              text-black
              transition
              hover:bg-zinc-200
            "
          >
            Atualizar agora
          </button>
        </div>
      ) : null}

      {canPromptInstall || showIosGuide ? (
        <div
          role="dialog"
          aria-label="Instalar Núcleo"
          className="
            fixed
            inset-x-4
            bottom-[calc(6.5rem+env(safe-area-inset-bottom))]
            z-[80]
            mx-auto
            max-w-md
            rounded-2xl
            border
            border-white/10
            bg-[#090909]/95
            p-4
            text-sm
            text-zinc-200
            shadow-[0_20px_70px_rgba(0,0,0,0.65)]
            backdrop-blur-xl
            lg:bottom-6
          "
        >
          <div className="flex items-start gap-3">
            <Download className="mt-0.5 size-4 shrink-0 text-zinc-300" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">
                Instalar Núcleo
              </p>

              {showIosGuide ? (
                <ol className="mt-2 space-y-1 text-xs leading-5 text-zinc-400">
                  <li>1. Toque em Compartilhar.</li>
                  <li>2. Escolha Adicionar à Tela de Início.</li>
                  <li>3. Confirme em Adicionar.</li>
                </ol>
              ) : (
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  Adicione o Núcleo à tela inicial para abrir em modo de aplicativo.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={dismissInstallGuide}
              className="
                flex
                size-8
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-white/10
                text-zinc-500
                transition
                hover:bg-white/[0.06]
                hover:text-white
              "
              aria-label="Dispensar instalação do Núcleo"
            >
              <X className="size-4" />
            </button>
          </div>

          {canPromptInstall ? (
            <button
              type="button"
              onClick={installApp}
              className="
                mt-3
                w-full
                rounded-xl
                bg-white
                px-4
                py-2.5
                text-sm
                font-semibold
                text-black
                transition
                hover:bg-zinc-200
              "
            >
              Instalar Núcleo
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
