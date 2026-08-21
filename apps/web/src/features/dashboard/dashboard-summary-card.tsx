import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import {
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

interface DashboardSummaryCardProps {
  title: string;
  value: string;
  detail: string;
  href: string;
  icon: LucideIcon;
  unavailable?: boolean;
}

export function DashboardSummaryCard({
  title,
  value,
  detail,
  href,
  icon: Icon,
  unavailable = false,
}: DashboardSummaryCardProps) {
  return (
    <Link href={href}>
      <Surface
        variant="interactive"
        className="group h-full min-h-36"
      >
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.055] text-zinc-400">
            <Icon className="h-[1.1rem] w-[1.1rem]" />
          </div>

          <ArrowUpRight className="h-4 w-4 text-zinc-700 transition group-hover:text-zinc-300" />
        </div>

        <p
          className={cn(
            "mt-5 text-2xl font-semibold tracking-[-0.035em]",
            unavailable
              ? "text-zinc-700"
              : "text-white",
          )}
        >
          {unavailable ? "—" : value}
        </p>

        <p className="mt-1 text-xs font-medium text-zinc-500">
          {title}
        </p>

        <p className="mt-2 text-[0.68rem] text-zinc-700">
          {unavailable
            ? "Indisponível agora"
            : detail}
        </p>
      </Surface>
    </Link>
  );
}