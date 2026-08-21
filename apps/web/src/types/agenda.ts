export type AgendaViewMode =
  | "day"
  | "week"
  | "month";

export type AgendaCategory =
  | "APPOINTMENT"
  | "HEALTH"
  | "SCHOOL"
  | "FAMILY"
  | "PERSONAL"
  | "BIRTHDAY"
  | "TASK"
  | "OTHER";

export type OccurrenceStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

export type RecurrenceFrequency =
  | "NONE"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "YEARLY";

export type AgendaDayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface AgendaAssignedMember {
  membershipId: string;
  userId: string;
  name: string;
}

export interface AgendaOccurrenceSummary {
  occurrenceId: string;
  eventId: string;
  title: string;
  category: AgendaCategory;
  location: string | null;
  allDay: boolean;
  startsAt: string;
  endsAt: string | null;
  status: OccurrenceStatus;
  assignedTo: AgendaAssignedMember | null;
}

export interface AgendaCreatedBy {
  userId: string;
  name: string;
}

export interface AgendaRecurrenceDetails {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: string | null;
  until: string | null;
  count: number | null;
}

export interface AgendaOccurrenceDetails {
  occurrenceId: string;
  eventId: string;
  title: string;
  description: string | null;
  category: AgendaCategory;
  location: string | null;
  allDay: boolean;
  startsAt: string;
  endsAt: string | null;
  status: OccurrenceStatus;
  assignedTo: AgendaAssignedMember | null;
  createdBy: AgendaCreatedBy;
  recurrence: AgendaRecurrenceDetails | null;
  remindersInMinutes: number[];
  completedAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
}

export interface AgendaRecurrenceRequest {
  frequency: RecurrenceFrequency;
  interval?: number;
  daysOfWeek?: AgendaDayOfWeek[];
  until?: string;
  count?: number;
}

export interface CreateAgendaEventRequest {
  title: string;
  description?: string;
  category: AgendaCategory;
  location?: string;
  allDay: boolean;
  startsAt: string;
  endsAt?: string;
  assignedToMembershipId?: string;
  recurrence?: AgendaRecurrenceRequest;
  remindersInMinutes?: number[];
}

export interface CreateAgendaEventResponse {
  eventId: string;
  recurrenceFrequency: RecurrenceFrequency;
  occurrencesCreated: number;
  firstOccurrenceStartsAt: string;
  lastOccurrenceStartsAt: string;
}

export interface AgendaOccurrenceActionRequest {
  notes?: string;
}

export interface DuplicateAgendaEventRequest {
  title?: string;
  startsAt?: string;
  endsAt?: string;
}

export interface AgendaPeriod {
  from: string;
  to: string;
}