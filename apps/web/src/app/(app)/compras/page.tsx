import { ShoppingPage } from "@/features/shopping/shopping-page";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Compras",
};

export default function ShoppingRoute() {
  return (
    <Suspense fallback={<ShoppingFallback />}>
      <ShoppingPage />
    </Suspense>
  );
}

function ShoppingFallback() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-3 w-32 rounded bg-white/[0.05]" />
        <div className="mt-3 h-8 w-40 rounded bg-white/[0.07]" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map(
          (_, index) => (
            <div
              key={index}
              className="h-52 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.03]"
            />
          ),
        )}
      </div>
    </div>
  );
}