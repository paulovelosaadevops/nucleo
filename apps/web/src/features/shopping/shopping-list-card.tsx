import { cn } from "@/lib/cn";
import type { ShoppingListSummary } from "@/types/shopping";
import {
  CalendarDays,
  Check,
  ChevronRight,
  ShoppingBasket,
} from "lucide-react";

interface ShoppingListCardProps {
  list: ShoppingListSummary;
  onClick: () => void;
}

const currencyFormatter =
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const dateFormatter =
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  });

function parseLocalDate(value: string): Date {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

export function ShoppingListCard({
  list,
  onClick,
}: ShoppingListCardProps) {
  const resolvedItems =
    list.purchasedItems +
    list.cancelledItems;

  const progress =
    list.totalItems > 0
      ? Math.min(
          100,
          Math.round(
            (
              resolvedItems /
              list.totalItems
            ) * 100,
          ),
        )
      : 0;

  const completed =
    list.status === "COMPLETED";

  const archived =
    list.status === "ARCHIVED";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-[1.35rem] border p-4 text-left transition",
        completed || archived
          ? "border-white/[0.055] bg-white/[0.02] opacity-65"
          : "border-white/[0.08] bg-white/[0.04] hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.065]",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/25 text-zinc-400">
          {completed ? (
            <Check className="h-5 w-5" />
          ) : (
            <ShoppingBasket className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-200 group-hover:text-white">
                {list.name}
              </p>

              <p className="mt-1 text-[0.68rem] text-zinc-600">
                Criada por {list.createdByName}
              </p>
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-zinc-300" />
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-zinc-600 to-zinc-200 transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[0.66rem] text-zinc-600">
            <span>
              {list.purchasedItems} de{" "}
              {list.totalItems} comprados
            </span>

            <span>{progress}%</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.055] pt-3">
            <div className="flex items-center gap-3 text-[0.68rem] text-zinc-600">
              <span>
                {list.pendingItems} pendentes
              </span>

              {list.dueDate && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {dateFormatter.format(
                    parseLocalDate(
                      list.dueDate,
                    ),
                  )}
                </span>
              )}
            </div>

            <span className="text-xs font-medium text-zinc-400">
              {currencyFormatter.format(
                list.actualTotal > 0
                  ? list.actualTotal
                  : list.estimatedTotal,
              )}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}