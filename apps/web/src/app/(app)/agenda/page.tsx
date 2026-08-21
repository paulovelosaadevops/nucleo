import { AgendaPage } from "@/features/agenda/agenda-page";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Agenda",
};

export default function AgendaRoute() {
  return (
    <Suspense fallback={<AgendaPageFallback />}>
      <AgendaPage />
    </Suspense>
  );
}

function AgendaPageFallback() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-3 w-28 rounded bg-white/[0.05]" />
        <div className="mt-3 h-8 w-40 rounded-lg bg-white/[0.07]" />
      </div>

      <div className="h-28 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.03]" />

      <div className="space-y-3">
        {Array.from({ length: 3 }).map(
          (_, index) => (
            <div
              key={index}
              className="h-28 rounded-[1.25rem] border border-white/[0.06] bg-white/[0.03]"
            />
          ),
        )}
      </div>
    </div>
  );
}