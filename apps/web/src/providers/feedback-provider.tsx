"use client";

import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";
import {
  type ConfirmDialogOptions,
  type PromptDialogOptions,
  type ToastOptions,
  type ToastVariant,
  registerFeedbackBridge,
} from "@/lib/feedback";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface FeedbackProviderProps {
  children: ReactNode;
}

type ToastState = ToastOptions & {
  id: string;
};

type ConfirmState = ConfirmDialogOptions & {
  id: string;
  resolve: (value: boolean) => void;
};

type PromptState = PromptDialogOptions & {
  id: string;
  resolve: (value: string | null) => void;
};

const toastAppearance: Record<
  ToastVariant,
  {
    icon: typeof Info;
    className: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    className:
      "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-100",
  },
  error: {
    icon: XCircle,
    className:
      "border-red-400/20 bg-red-400/[0.08] text-red-100",
  },
  warning: {
    icon: AlertTriangle,
    className:
      "border-amber-400/20 bg-amber-400/[0.08] text-amber-100",
  },
  info: {
    icon: Info,
    className:
      "border-white/10 bg-[#090909]/95 text-zinc-100",
  },
};

function nextId() {
  return crypto.randomUUID();
}

export function FeedbackProvider({
  children,
}: FeedbackProviderProps) {
  const [toasts, setToasts] =
    useState<ToastState[]>([]);
  const [confirmState, setConfirmState] =
    useState<ConfirmState | null>(null);
  const [promptState, setPromptState] =
    useState<PromptState | null>(null);
  const [promptValue, setPromptValue] =
    useState("");
  const busyRef = useRef(false);

  const removeToast = useCallback((id: string) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id),
    );
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = nextId();
      setToasts((current) => [
        ...current.slice(-2),
        {
          id,
          variant: "info",
          ...options,
        },
      ]);

      window.setTimeout(() => removeToast(id), 4200);
    },
    [removeToast],
  );

  const requestConfirmation = useCallback(
    (options: ConfirmDialogOptions) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({
          id: nextId(),
          resolve,
          cancelLabel: "Cancelar",
          confirmLabel: "Confirmar",
          variant: "default",
          ...options,
        });
      }),
    [],
  );

  const requestInput = useCallback(
    (options: PromptDialogOptions) =>
      new Promise<string | null>((resolve) => {
        setPromptValue(options.defaultValue ?? "");
        setPromptState({
          id: nextId(),
          resolve,
          cancelLabel: "Cancelar",
          confirmLabel: "Confirmar",
          variant: "default",
          type: "text",
          ...options,
        });
      }),
    [],
  );

  useEffect(() => {
    return registerFeedbackBridge({
      toast: showToast,
      requestConfirmation,
      requestInput,
    });
  }, [
    requestConfirmation,
    requestInput,
    showToast,
  ]);

  const bridge = useMemo(
    () => ({
      closeConfirm(value: boolean) {
        if (busyRef.current) {
          return;
        }

        busyRef.current = true;
        confirmState?.resolve(value);
        setConfirmState(null);
        window.setTimeout(() => {
          busyRef.current = false;
        }, 120);
      },
      closePrompt(value: string | null) {
        if (busyRef.current) {
          return;
        }

        busyRef.current = true;
        promptState?.resolve(value);
        setPromptState(null);
        window.setTimeout(() => {
          busyRef.current = false;
        }, 120);
      },
    }),
    [
      confirmState,
      promptState,
    ],
  );

  return (
    <>
      {children}

      <ToastViewport
        toasts={toasts}
        onDismiss={removeToast}
      />

      {confirmState ? (
        <ModalShell
          eyebrow="Confirmação"
          title={confirmState.title}
          titleId="confirm-dialog-title"
          size="small"
          layer="nested"
          onClose={() => bridge.closeConfirm(false)}
        >
          <div className="space-y-5 p-5 sm:p-7">
            <p className="text-sm leading-6 text-zinc-400">
              {confirmState.description}
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={() =>
                  bridge.closeConfirm(false)
                }
              >
                {confirmState.cancelLabel}
              </Button>

              <Button
                variant={
                  confirmState.variant === "danger"
                    ? "danger"
                    : "primary"
                }
                onClick={() =>
                  bridge.closeConfirm(true)
                }
              >
                {confirmState.confirmLabel}
              </Button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {promptState ? (
        <ModalShell
          eyebrow="Informação"
          title={promptState.title}
          titleId="prompt-dialog-title"
          size="small"
          layer="nested"
          onClose={() => bridge.closePrompt(null)}
        >
          <form
            className="space-y-5 p-5 sm:p-7"
            onSubmit={(event) => {
              event.preventDefault();
              bridge.closePrompt(promptValue);
            }}
          >
            <p className="text-sm leading-6 text-zinc-400">
              {promptState.description}
            </p>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">
                {promptState.label}
              </span>
              <input
                autoFocus
                type={promptState.type}
                inputMode={promptState.inputMode}
                placeholder={promptState.placeholder}
                value={promptValue}
                onChange={(event) =>
                  setPromptValue(event.target.value)
                }
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30"
              />
            </label>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  bridge.closePrompt(null)
                }
              >
                {promptState.cancelLabel}
              </Button>

              <Button type="submit">
                {promptState.confirmLabel}
              </Button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastState[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed inset-x-4 top-[calc(1rem+env(safe-area-inset-top))] z-[140] mx-auto flex max-w-md flex-col gap-2 sm:right-5 sm:left-auto sm:mx-0">
      {toasts.map((toast) => {
        const variant = toast.variant ?? "info";
        const appearance = toastAppearance[variant];
        const Icon = appearance.icon;

        return (
          <div
            key={toast.id}
            role="status"
            className={[
              "flex items-start gap-3 rounded-2xl border p-4 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl",
              appearance.className,
            ].join(" ")}
          >
            <Icon className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              {toast.title ? (
                <p className="text-sm font-semibold">
                  {toast.title}
                </p>
              ) : null}
              <p className="text-sm leading-5 opacity-90">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              aria-label="Fechar mensagem"
              onClick={() => onDismiss(toast.id)}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-current opacity-60 transition hover:bg-white/10 hover:opacity-100"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
