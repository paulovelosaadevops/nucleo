import { Surface } from "@/components/ui/surface";
import type { DashboardShoppingList } from "@/types/dashboard";
import {
  ArrowRight,
  ShoppingBasket,
} from "lucide-react";
import Link from "next/link";

interface DashboardShoppingProps {
  lists: DashboardShoppingList[];
  unavailable?: boolean;
}

export function DashboardShopping({
  lists,
  unavailable = false,
}: DashboardShoppingProps) {
  return (
    <Surface className="h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-600">
            Listas em andamento
          </p>

          <h2 className="mt-1 text-lg font-semibold text-white">
            Compras
          </h2>
        </div>

        <Link
          href="/compras"
          className="flex items-center gap-1 text-xs font-medium text-zinc-500 transition hover:text-white"
        >
          Ver listas
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {unavailable ? (
        <div className="flex min-h-44 items-center justify-center text-center">
          <p className="text-sm text-zinc-600">
            Compras indisponíveis agora.
          </p>
        </div>
      ) : lists.length === 0 ? (
        <div className="flex min-h-44 flex-col items-center justify-center text-center">
          <ShoppingBasket className="h-6 w-6 text-zinc-700" />

          <p className="mt-3 text-sm text-zinc-500">
            Nenhuma lista em andamento.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {lists.map((list) => {
            const completed =
              list.purchasedItems +
              list.cancelledItems;

            const progress =
              list.totalItems > 0
                ? Math.min(
                    100,
                    Math.round(
                      (completed / list.totalItems) *
                        100,
                    ),
                  )
                : 0;

            return (
              <Link
                key={list.id}
                href={`/compras?lista=${list.id}`}
                className="block rounded-2xl border border-white/[0.07] bg-black/20 p-3.5 transition hover:border-white/15 hover:bg-white/[0.035]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {list.name}
                  </p>

                  <span className="shrink-0 text-[0.68rem] text-zinc-600">
                    {list.pendingItems} pendentes
                  </span>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-zinc-600 to-zinc-200 transition-all"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-[0.65rem] text-zinc-700">
                  <span>
                    {list.purchasedItems} comprados
                  </span>
                  <span>{progress}%</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Surface>
  );
}