"use client";

import { cn } from "@/lib/cn";
import { useId } from "react";

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export function BrandMark({
  compact = false,
  className,
}: BrandMarkProps) {
  const generatedId = useId().replace(/:/g, "");
  const gradientId = `nucleo-gradient-${generatedId}`;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3",
        className,
      )}
    >
      <svg
        aria-hidden="true"
        className="h-10 w-10 shrink-0"
        viewBox="0 0 48 48"
        fill="none"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="8"
            y1="5"
            x2="40"
            y2="43"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFFFFF" />
            <stop
              offset="0.48"
              stopColor="#C8C8CE"
            />
            <stop
              offset="1"
              stopColor="#6B6B72"
            />
          </linearGradient>
        </defs>

        <path
          d="M24 3.75 41.54 13.88v20.24L24 44.25 6.46 34.12V13.88L24 3.75Z"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.5"
        />

        <path
          d="M16 32V16l16 16V16"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle
          cx="24"
          cy="24"
          r="2.25"
          fill="#F7F7F8"
        />
      </svg>

      {!compact && (
        <div className="flex flex-col">
          <span className="text-[1.05rem] font-semibold tracking-[0.28em] text-white">
            NÚCLEO
          </span>

          <span className="text-[0.58rem] font-medium tracking-[0.22em] text-zinc-500">
            CENTRAL FAMILIAR
          </span>
        </div>
      )}
    </div>
  );
}