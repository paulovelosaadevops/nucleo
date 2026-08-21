import { cn } from "@/lib/cn";
import type {
  AgendaCategory,
  AgendaOccurrenceSummary,
} from "@/types/agenda";
import {
  BriefcaseMedical,
  Cake,
  CalendarClock,
  Check,
  CircleUserRound,
  Clock3,
  GraduationCap,
  House,
  ListChecks,
  MapPin,
  Stethoscope,
  UsersRound,
} from "lucide-react";

interface AgendaOccurrenceCardProps {
  occurrence: AgendaOccurrenceSummary;
  onClick: () => void;
}

const categoryConfiguration: Record<
  AgendaCategory,
  {
    label: string;
    icon: typeof CalendarClock;
  }
> = {
  APPOINTMENT: {
    label: "Compromisso",
    icon: CalendarClock,
  },
  HEALTH: {
    label: "Saúde",
    icon: Stethoscope,
  },
  SCHOOL: {
    label: "Escola",
    icon: GraduationCap,
  },
  FAMILY: {
    label: "Família",
    icon: UsersRound,
  },
  PERSONAL: {
    label: "Pessoal",
    icon: CircleUserRound,
  },
  BIRTHDAY: {
    label: "Aniversário",
    icon: Cake,
  },
  TASK: {
    label: "Tarefa",
    icon: ListChecks,
  },
  OTHER: {
    label: "Outro",
    icon: BriefcaseMedical,
  },
};

const timeFormatter =
  new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

export function AgendaOccurrenceCard({
  occurrence,
  onClick,
}: AgendaOccurrenceCardProps) {
  const category =
    categoryConfiguration[
      occurrence.category
    ];

  const CategoryIcon = category.icon;
  const startsAt = new Date(
    occurrence.startsAt,
  );

  const completed =
    occurrence.status === "COMPLETED";

  const cancelled =
    occurrence.status === "CANCELLED";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full gap-3 rounded-[1.25rem] border p-4 text-left transition",
        completed || cancelled
          ? "border-white/[0.05] bg-white/[0.02] opacity-60"
          : "border-white/[0.08] bg-white/[0.04] hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.065]",
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/25 text-zinc-400">
        {completed ? (
          <Check className="h-5 w-5" />
        ) : (
          <CategoryIcon className="h-5 w-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-sm font-medium text-zinc-200 group-hover:text-white",
                completed &&
                  "line-through decoration-zinc-600",
              )}
            >
              {occurrence.title}
            </p>

            <p className="mt-1 text-[0.68rem] text-zinc-600">
              {category.label}
            </p>
          </div>

          <span className="shrink-0 rounded-lg border border-white/[0.07] bg-black/20 px-2 py-1 text-[0.65rem] font-medium text-zinc-500">
            {occurrence.allDay
              ? "Dia inteiro"
              : timeFormatter.format(startsAt)}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.68rem] text-zinc-600">
          {!occurrence.allDay && (
            <span className="flex items-center gap-1">
              <Clock3 className="h-3 w-3" />

              {timeFormatter.format(startsAt)}

              {occurrence.endsAt && (
                <>
                  {" — "}
                  {timeFormatter.format(
                    new Date(occurrence.endsAt),
                  )}
                </>
              )}
            </span>
          )}

          {occurrence.location && (
            <span className="flex max-w-44 items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {occurrence.location}
            </span>
          )}

          {occurrence.assignedTo && (
            <span className="flex max-w-44 items-center gap-1 truncate">
              <House className="h-3 w-3 shrink-0" />
              {occurrence.assignedTo.name}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}