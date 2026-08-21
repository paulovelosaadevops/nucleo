import { Surface } from "@/components/ui/surface";
import { DashboardAgendaCalendar } from "@/features/dashboard/dashboard-agenda-calendar";
import type {
  DashboardAgendaOccurrence,
} from "@/types/dashboard";
import {
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface DashboardAgendaProps {
  occurrences:
    DashboardAgendaOccurrence[];
  unavailable?: boolean;
}

export function DashboardAgenda({
  occurrences,
  unavailable = false,
}: DashboardAgendaProps) {
  return (
    <Surface
      variant="elevated"
      className="h-full"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-zinc-600">
            Calendário familiar
          </p>

          <h2 className="mt-1 text-lg font-semibold text-white">
            Agenda
          </h2>
        </div>

        <Link
          href="/agenda"
          className="
            flex
            shrink-0
            items-center
            gap-1
            text-xs
            font-medium
            text-zinc-500
            transition
            hover:text-white
          "
        >
          Ver agenda

          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <DashboardAgendaCalendar
        initialOccurrences={
          occurrences
        }
        unavailable={unavailable}
      />
    </Surface>
  );
}