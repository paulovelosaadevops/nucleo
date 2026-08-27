export type ToastVariant =
  | "success"
  | "error"
  | "warning"
  | "info";

export interface ToastOptions {
  title?: string;
  message: string;
  variant?: ToastVariant;
}

export interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
}

export interface PromptDialogOptions
  extends ConfirmDialogOptions {
  label: string;
  defaultValue?: string;
  placeholder?: string;
  inputMode?:
    | "text"
    | "decimal"
    | "numeric"
    | "tel"
    | "search"
    | "email"
    | "url";
  type?: "text" | "date" | "number";
}

interface FeedbackBridge {
  toast: (options: ToastOptions) => void;
  requestConfirmation: (
    options: ConfirmDialogOptions,
  ) => Promise<boolean>;
  requestInput: (
    options: PromptDialogOptions,
  ) => Promise<string | null>;
}

let bridge: FeedbackBridge | null = null;

export function registerFeedbackBridge(
  nextBridge: FeedbackBridge,
) {
  bridge = nextBridge;

  return () => {
    if (bridge === nextBridge) {
      bridge = null;
    }
  };
}

export function toast(options: ToastOptions) {
  bridge?.toast(options);
}

export function confirmDialog(
  options: ConfirmDialogOptions,
) {
  return (
    bridge?.requestConfirmation(options) ??
    Promise.resolve(false)
  );
}

export function promptDialog(
  options: PromptDialogOptions,
) {
  return (
    bridge?.requestInput(options) ?? Promise.resolve(null)
  );
}
