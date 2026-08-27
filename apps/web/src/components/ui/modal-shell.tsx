"use client";

import { cn } from "@/lib/cn";
import { acquireBodyScrollLock } from "@/lib/body-scroll-lock";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ModalSize =
  | "small"
  | "medium"
  | "large"
  | "invoice";

type ModalLayer =
  | "default"
  | "nested";

interface ModalShellProps {
  eyebrow: string;
  title: string;
  titleId: string;
  busy?: boolean;
  size?: ModalSize;
  layer?: ModalLayer;
  children: ReactNode;
  onClose: () => void;
}

const sizeClassNames: Record<
  ModalSize,
  string
> = {
  small: "sm:max-w-lg",
  medium: "sm:max-w-2xl",
  large: "sm:max-w-4xl",
  invoice: "sm:max-w-[960px]",
};

const layerClassNames: Record<
  ModalLayer,
  string
> = {
  default: "z-[100]",
  nested: "z-[120]",
};

export function ModalShell({
  eyebrow,
  title,
  titleId,
  busy = false,
  size = "medium",
  layer = "default",
  children,
  onClose,
}: ModalShellProps) {
  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    return acquireBodyScrollLock();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key === "Escape" &&
        !busy
      ) {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    busy,
    mounted,
    onClose,
  ]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      role="presentation"
      className={cn(
        `
          fixed
          inset-0
          flex
          items-end
          justify-center
          bg-black/80
          p-0
          backdrop-blur-sm
          sm:items-center
          sm:p-6
        `,
        layerClassNames[layer],
      )}
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !busy
        ) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy}
        className={cn(
          `
            flex
            max-h-[100dvh]
            w-full
            flex-col
            overflow-hidden
            rounded-none
            border
            border-white/10
            bg-[#090909]
            shadow-[0_32px_100px_rgba(0,0,0,0.8)]
            sm:max-h-[90dvh]
            sm:rounded-[1.5rem]
          `,
          sizeClassNames[size],
        )}
      >
        <header
          className="
            relative
            z-10
            flex
            shrink-0
            items-start
            justify-between
            gap-4
            border-b
            border-white/10
            bg-[#090909]/95
            px-4
            py-3
            backdrop-blur-xl
            sm:px-7
            sm:py-4
          "
        >
          <div className="min-w-0">
            <p
              className="
                text-xs
                font-medium
                uppercase
                tracking-[0.16em]
                text-zinc-600
              "
            >
              {eyebrow}
            </p>

            <h2
              id={titleId}
              className="
                mt-1
                truncate
                text-xl
                font-semibold
                text-white
              "
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            aria-label="Fechar modal"
            className="
              flex
              size-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-white/10
              text-zinc-400
              transition
              hover:bg-white/[0.06]
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <X className="size-4" />
          </button>
        </header>

        {children}
      </section>
    </div>,
    document.body,
  );
}
