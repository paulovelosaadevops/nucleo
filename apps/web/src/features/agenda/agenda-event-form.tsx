"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  downloadAgendaIcs,
  openAgendaIcs,
  shareAgendaIcsFile,
  type CalendarExportEvent,
} from "@/features/agenda/agenda-calendar-export";
import { apiRequest } from "@/lib/api/api-client";
import { getErrorMessage } from "@/lib/api/api-error";
import { cn } from "@/lib/cn";
import {
  confirmDialog,
} from "@/lib/feedback";

import type {
  AgendaCategory,
  AgendaDayOfWeek,
  CreateAgendaEventRequest,
  CreateAgendaEventResponse,
  RecurrenceFrequency,
} from "@/types/agenda";
import { useAuth } from "@/hooks/use-auth";

import {
  Bell,
  CalendarDays,
  MapPin,
  Repeat2,
  UserRound,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { createPortal } from "react-dom";

interface FamilyMemberOption {
  membershipId: string;
  name: string;
  status: string;
}

interface AgendaEventFormProps {
  open: boolean;
  initialDate: string;
  loading: boolean;
  onClose: () => void;
  onCreate: (
    request: CreateAgendaEventRequest,
  ) => Promise<CreateAgendaEventResponse>;
}

const categories: Array<{
  value: AgendaCategory;
  label: string;
}> = [
  {
    value: "APPOINTMENT",
    label: "Compromisso",
  },
  {
    value: "HEALTH",
    label: "Saúde",
  },
  {
    value: "SCHOOL",
    label: "Escola",
  },
  {
    value: "FAMILY",
    label: "Família",
  },
  {
    value: "PERSONAL",
    label: "Pessoal",
  },
  {
    value: "BIRTHDAY",
    label: "Aniversário",
  },
  {
    value: "TASK",
    label: "Tarefa",
  },
  {
    value: "OTHER",
    label: "Outro",
  },
];

const recurrenceOptions: Array<{
  value: RecurrenceFrequency;
  label: string;
}> = [
  {
    value: "NONE",
    label: "Não repetir",
  },
  {
    value: "DAILY",
    label: "Diariamente",
  },
  {
    value: "WEEKLY",
    label: "Semanalmente",
  },
  {
    value: "MONTHLY",
    label: "Mensalmente",
  },
  {
    value: "YEARLY",
    label: "Anualmente",
  },
];

const weekDays: Array<{
  value: AgendaDayOfWeek;
  label: string;
}> = [
  {
    value: "MONDAY",
    label: "S",
  },
  {
    value: "TUESDAY",
    label: "T",
  },
  {
    value: "WEDNESDAY",
    label: "Q",
  },
  {
    value: "THURSDAY",
    label: "Q",
  },
  {
    value: "FRIDAY",
    label: "S",
  },
  {
    value: "SATURDAY",
    label: "S",
  },
  {
    value: "SUNDAY",
    label: "D",
  },
];

const reminderOptions = [
  {
    value: 0,
    label: "No horário",
  },
  {
    value: 10,
    label: "10 minutos antes",
  },
  {
    value: 30,
    label: "30 minutos antes",
  },
  {
    value: 60,
    label: "1 hora antes",
  },
  {
    value: 1440,
    label: "1 dia antes",
  },
];

function toIsoDateTime(
  date: string,
  time: string,
): string {
  return new Date(
    `${date}T${time}:00`,
  ).toISOString();
}

export function AgendaEventForm({
  open,
  initialDate,
  loading,
  onClose,
  onCreate,
}: AgendaEventFormProps) {
  const { session } = useAuth();

  const [mounted, setMounted] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [category, setCategory] =
    useState<AgendaCategory>("APPOINTMENT");

  const [location, setLocation] =
    useState("");

  const [allDay, setAllDay] =
    useState(false);

  const [startDate, setStartDate] =
    useState(initialDate);

  const [startTime, setStartTime] =
    useState("09:00");

  const [endDate, setEndDate] =
    useState(initialDate);

  const [endTime, setEndTime] =
    useState("10:00");

  const [
    assignedMembershipId,
    setAssignedMembershipId,
  ] = useState("");

  const [recurrence, setRecurrence] =
    useState<RecurrenceFrequency>("NONE");

  const [
    recurrenceInterval,
    setRecurrenceInterval,
  ] = useState("1");

  const [
    recurrenceCount,
    setRecurrenceCount,
  ] = useState("");

  const [selectedDays, setSelectedDays] =
    useState<AgendaDayOfWeek[]>([]);

  const [reminders, setReminders] =
    useState<number[]>([30]);

  const [members, setMembers] =
    useState<FamilyMemberOption[]>([]);

  const [formError, setFormError] =
    useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setStartDate(initialDate);
    setEndDate(initialDate);

    void apiRequest<FamilyMemberOption[]>(
      "/api/family/members",
    )
      .then((response) => {
        setMembers(
          response.filter(
            (member) =>
              member.status === "ACTIVE",
          ),
        );
      })
      .catch(() => {
        setMembers([]);
      });
  }, [
    initialDate,
    open,
  ]);

  function reset() {
    setTitle("");
    setDescription("");
    setCategory("APPOINTMENT");
    setLocation("");
    setAllDay(false);
    setStartDate(initialDate);
    setStartTime("09:00");
    setEndDate(initialDate);
    setEndTime("10:00");
    setAssignedMembershipId("");
    setRecurrence("NONE");
    setRecurrenceInterval("1");
    setRecurrenceCount("");
    setSelectedDays([]);
    setReminders([30]);
    setFormError(null);
  }

  function handleClose() {
    if (loading) {
      return;
    }

    reset();
    onClose();
  }

  function toggleDay(
    day: AgendaDayOfWeek,
  ) {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter(
            (currentDay) =>
              currentDay !== day,
          )
        : [
            ...current,
            day,
          ],
    );
  }

  function toggleReminder(
    value: number,
  ) {
    setReminders((current) =>
      current.includes(value)
        ? current.filter(
            (reminder) =>
              reminder !== value,
          )
        : [
            ...current,
            value,
          ].sort(
            (left, right) =>
              left - right,
          ),
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError(null);

    const normalizedTitle =
      title.trim().replace(/\s+/g, " ");

    if (normalizedTitle.length < 2) {
      setFormError(
        "Informe um título com pelo menos 2 caracteres.",
      );
      return;
    }

    const startsAt = allDay
      ? toIsoDateTime(
          startDate,
          "00:00",
        )
      : toIsoDateTime(
          startDate,
          startTime,
        );

    const endsAt = allDay
      ? toIsoDateTime(
          endDate,
          "23:59",
        )
      : toIsoDateTime(
          endDate,
          endTime,
        );

    if (
      new Date(endsAt).getTime() <
      new Date(startsAt).getTime()
    ) {
      setFormError(
        "O término não pode ser anterior ao início.",
      );
      return;
    }

    if (
      recurrence === "WEEKLY" &&
      selectedDays.length === 0
    ) {
      setFormError(
        "Selecione pelo menos um dia da semana.",
      );
      return;
    }

    const interval =
      Number(recurrenceInterval);

    if (
      recurrence !== "NONE" &&
      (
        !Number.isInteger(interval) ||
        interval < 1 ||
        interval > 365
      )
    ) {
      setFormError(
        "Informe um intervalo de recorrência válido.",
      );
      return;
    }

    try {
      const request: CreateAgendaEventRequest = {
        title: normalizedTitle,
        description:
          description.trim() || undefined,
        category,
        location:
          location.trim() || undefined,
        allDay,
        startsAt,
        endsAt,
        assignedToMembershipId:
          assignedMembershipId || undefined,
        recurrence:
          recurrence === "NONE"
            ? undefined
            : {
                frequency: recurrence,
                interval,
                daysOfWeek:
                  recurrence === "WEEKLY"
                    ? selectedDays
                    : undefined,
                count: recurrenceCount
                  ? Number(
                      recurrenceCount,
                    )
                  : undefined,
              },
        remindersInMinutes: reminders,
      };

      const response = await onCreate(request);

      reset();
      onClose();

      const shouldAddToCalendar =
        await confirmDialog({
          title: "Compromisso criado",
          description:
            "O calendário será aberto. Confirme em Adicionar para salvar o compromisso.",
          cancelLabel: "Agora não",
          confirmLabel: "Abrir calendário",
        });

      if (!shouldAddToCalendar) {
        return;
      }

      const assignedToName = members.find(
        (member) =>
          member.membershipId === assignedMembershipId,
      )?.name;
      const calendarEvent: CalendarExportEvent = {
        request,
        response,
        assignedToName,
        timeZone:
          session?.family.timeZone ??
          "America/Sao_Paulo",
        url:
          typeof window !== "undefined"
            ? window.location.href
            : undefined,
      };

      try {
        openAgendaIcs(calendarEvent);
      } catch (shareError) {
        if (
          shareError instanceof DOMException &&
          shareError.name === "AbortError"
        ) {
          return;
        }

        const shouldDownload = await confirmDialog({
          title: "Calendário indisponível",
          description:
            "Não foi possível abrir o calendário nativo. Baixe o arquivo de calendário para importar manualmente.",
          cancelLabel: "Compartilhar arquivo",
          confirmLabel: "Baixar arquivo de calendário",
        });

        if (shouldDownload) {
          downloadAgendaIcs(calendarEvent);
          return;
        }

        await shareAgendaIcsFile(calendarEvent);
      }
    } catch (error) {
      setFormError(
        getErrorMessage(error),
      );
    }
  }

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      role="presentation"
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-end
        justify-center
        bg-black/80
        p-0
        backdrop-blur-sm
        sm:items-center
        sm:p-6
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          handleClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="agenda-form-title"
        aria-busy={loading}
        className="
          flex
          max-h-[94dvh]
          w-full
          flex-col
          overflow-hidden
          rounded-t-[2rem]
          border
          border-white/10
          bg-[#090909]
          shadow-[0_32px_100px_rgba(0,0,0,0.8)]
          sm:max-h-[92dvh]
          sm:max-w-3xl
          sm:rounded-[2rem]
        "
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
            px-5
            py-5
            backdrop-blur-xl
            sm:px-7
          "
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-600">
              Agenda familiar
            </p>

            <h2
              id="agenda-form-title"
              className="mt-1 text-xl font-semibold text-white"
            >
              Novo compromisso
            </h2>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
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
              disabled:opacity-50
            "
            aria-label="Fechar formulário"
          >
            <X className="size-4" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="
            flex
            min-h-0
            flex-1
            flex-col
          "
        >
          <div
            className="
              min-h-0
              flex-1
              overflow-y-auto
              overscroll-contain
              p-5
              sm:p-7
            "
          >
            {formError && (
              <div
                role="alert"
                className="
                  mb-6
                  rounded-2xl
                  border
                  border-rose-400/20
                  bg-rose-400/[0.06]
                  px-4
                  py-3
                  text-sm
                  leading-6
                  text-rose-200
                "
              >
                {formError}
              </div>
            )}

            <fieldset
              disabled={loading}
              className="grid gap-5"
            >
              <Input
                label="Título"
                placeholder="Ex.: Consulta do Bernardo"
                maxLength={160}
                autoFocus
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value,
                  )
                }
              />

              <div>
                <label
                  htmlFor="agenda-description"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Descrição
                </label>

                <textarea
                  id="agenda-description"
                  rows={3}
                  maxLength={2000}
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value,
                    )
                  }
                  placeholder="Informações importantes"
                  className="
                    w-full
                    resize-none
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.045]
                    px-4
                    py-3
                    text-sm
                    text-white
                    outline-none
                    transition
                    placeholder:text-zinc-600
                    focus:border-white/30
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <SelectField
                  label="Categoria"
                  icon={
                    <CalendarDays className="size-4" />
                  }
                  value={category}
                  onChange={(value) =>
                    setCategory(
                      value as AgendaCategory,
                    )
                  }
                  options={categories}
                />

                <Input
                  label="Local"
                  placeholder="Opcional"
                  maxLength={255}
                  value={location}
                  leadingIcon={
                    <MapPin className="size-4" />
                  }
                  onChange={(event) =>
                    setLocation(
                      event.target.value,
                    )
                  }
                />
              </div>

              <label
                className="
                  flex
                  items-center
                  justify-between
                  rounded-2xl
                  border
                  border-white/[0.08]
                  bg-white/[0.03]
                  p-4
                "
              >
                <div>
                  <p className="text-sm font-medium text-zinc-300">
                    Dia inteiro
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    O compromisso ocupa todo o dia
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(event) =>
                    setAllDay(
                      event.target.checked,
                    )
                  }
                  className="size-5 accent-white"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <div
                  className="
                    rounded-2xl
                    border
                    border-white/[0.08]
                    bg-white/[0.025]
                    p-4
                  "
                >
                  <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                    Início
                  </p>

                  <div
                    className={cn(
                      "grid gap-3",
                      !allDay &&
                        "grid-cols-2",
                    )}
                  >
                    <Input
                      label="Data"
                      type="date"
                      value={startDate}
                      onChange={(event) => {
                        setStartDate(
                          event.target.value,
                        );

                        if (
                          endDate <
                          event.target.value
                        ) {
                          setEndDate(
                            event.target.value,
                          );
                        }
                      }}
                    />

                    {!allDay && (
                      <Input
                        label="Horário"
                        type="time"
                        value={startTime}
                        onChange={(event) =>
                          setStartTime(
                            event.target.value,
                          )
                        }
                      />
                    )}
                  </div>
                </div>

                <div
                  className="
                    rounded-2xl
                    border
                    border-white/[0.08]
                    bg-white/[0.025]
                    p-4
                  "
                >
                  <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                    Término
                  </p>

                  <div
                    className={cn(
                      "grid gap-3",
                      !allDay &&
                        "grid-cols-2",
                    )}
                  >
                    <Input
                      label="Data"
                      type="date"
                      min={startDate}
                      value={endDate}
                      onChange={(event) =>
                        setEndDate(
                          event.target.value,
                        )
                      }
                    />

                    {!allDay && (
                      <Input
                        label="Horário"
                        type="time"
                        value={endTime}
                        onChange={(event) =>
                          setEndTime(
                            event.target.value,
                          )
                        }
                      />
                    )}
                  </div>
                </div>
              </div>

              {members.length > 0 && (
                <SelectField
                  label="Responsável"
                  icon={
                    <UserRound className="size-4" />
                  }
                  value={
                    assignedMembershipId
                  }
                  onChange={
                    setAssignedMembershipId
                  }
                  options={[
                    {
                      value: "",
                      label:
                        "Sem responsável",
                    },
                    ...members.map(
                      (member) => ({
                        value:
                          member.membershipId,
                        label: member.name,
                      }),
                    ),
                  ]}
                />
              )}

              <SelectField
                label="Recorrência"
                icon={
                  <Repeat2 className="size-4" />
                }
                value={recurrence}
                onChange={(value) =>
                  setRecurrence(
                    value as RecurrenceFrequency,
                  )
                }
                options={recurrenceOptions}
              />

              {recurrence !== "NONE" && (
                <div
                  className="
                    rounded-2xl
                    border
                    border-white/[0.08]
                    bg-black/20
                    p-4
                  "
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Repetir a cada"
                      type="number"
                      min={1}
                      max={365}
                      value={
                        recurrenceInterval
                      }
                      onChange={(event) =>
                        setRecurrenceInterval(
                          event.target.value,
                        )
                      }
                    />

                    <Input
                      label="Quantidade"
                      type="number"
                      min={1}
                      max={500}
                      placeholder="Sem limite definido"
                      value={
                        recurrenceCount
                      }
                      onChange={(event) =>
                        setRecurrenceCount(
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  {recurrence ===
                    "WEEKLY" && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium text-zinc-300">
                        Dias da semana
                      </p>

                      <div className="grid grid-cols-7 gap-1.5">
                        {weekDays.map(
                          (day) => {
                            const active =
                              selectedDays.includes(
                                day.value,
                              );

                            return (
                              <button
                                key={
                                  day.value
                                }
                                type="button"
                                onClick={() =>
                                  toggleDay(
                                    day.value,
                                  )
                                }
                                className={cn(
                                  `
                                    h-10
                                    rounded-xl
                                    border
                                    text-xs
                                    font-medium
                                    transition
                                  `,
                                  active
                                    ? `
                                        border-white
                                        bg-white
                                        text-black
                                      `
                                    : `
                                        border-white/[0.08]
                                        bg-white/[0.03]
                                        text-zinc-500
                                        hover:text-white
                                      `,
                                )}
                              >
                                {day.label}
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Bell className="size-4 text-zinc-600" />
                  Lembretes
                </div>

                <div className="flex flex-wrap gap-2">
                  {reminderOptions.map(
                    (option) => {
                      const active =
                        reminders.includes(
                          option.value,
                        );

                      return (
                        <button
                          key={
                            option.value
                          }
                          type="button"
                          onClick={() =>
                            toggleReminder(
                              option.value,
                            )
                          }
                          className={cn(
                            `
                              rounded-xl
                              border
                              px-3
                              py-2
                              text-xs
                              transition
                            `,
                            active
                              ? `
                                  border-white/30
                                  bg-white
                                  text-black
                                `
                              : `
                                  border-white/[0.08]
                                  bg-white/[0.03]
                                  text-zinc-500
                                  hover:text-white
                                `,
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            </fieldset>
          </div>

          <footer
            className="
              flex
              shrink-0
              flex-col-reverse
              gap-2
              border-t
              border-white/10
              bg-[#090909]/95
              p-5
              backdrop-blur-xl
              sm:flex-row
              sm:justify-end
              sm:px-7
            "
          >
            <Button
              type="button"
              variant="secondary"
              size="large"
              disabled={loading}
              onClick={handleClose}
              className="sm:min-w-32"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              size="large"
              loading={loading}
              className="sm:min-w-48"
            >
              Criar compromisso
            </Button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  icon?: ReactNode;
  options: Array<{
    value: string;
    label: string;
  }>;
  onChange: (
    value: string,
  ) => void;
}

function SelectField({
  label,
  value,
  icon,
  options,
  onChange,
}: SelectFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-300">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
            {icon}
          </div>
        )}

        <select
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          className={cn(
            `
              h-12
              w-full
              appearance-none
              rounded-2xl
              border
              border-white/10
              bg-[#111113]
              px-4
              text-sm
              text-white
              outline-none
              transition
              focus:border-white/30
              disabled:cursor-not-allowed
              disabled:opacity-50
            `,
            icon && "pl-11",
          )}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
