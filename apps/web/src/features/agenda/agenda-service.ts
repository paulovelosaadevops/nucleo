import { apiRequest } from "@/lib/api/api-client";
import type {
  AgendaOccurrenceActionRequest,
  AgendaOccurrenceDetails,
  AgendaOccurrenceSummary,
  CreateAgendaEventRequest,
  CreateAgendaEventResponse,
  DuplicateAgendaEventRequest,
  OccurrenceStatus,
} from "@/types/agenda";

interface ListAgendaOccurrencesParameters {
  from: string;
  to: string;
  status?: OccurrenceStatus;
  assignedToMembershipId?: string;
}

export async function listAgendaOccurrences({
  from,
  to,
  status,
  assignedToMembershipId,
}: ListAgendaOccurrencesParameters) {
  const query = new URLSearchParams({
    from,
    to,
  });

  if (status) {
    query.set("status", status);
  }

  if (assignedToMembershipId) {
    query.set(
      "assignedToMembershipId",
      assignedToMembershipId,
    );
  }

  return apiRequest<AgendaOccurrenceSummary[]>(
    `/api/agenda/occurrences?${query}`,
  );
}

export async function getAgendaOccurrence(
  occurrenceId: string,
) {
  return apiRequest<AgendaOccurrenceDetails>(
    `/api/agenda/occurrences/${occurrenceId}`,
  );
}

export async function createAgendaEvent(
  request: CreateAgendaEventRequest,
) {
  return apiRequest<CreateAgendaEventResponse>(
    "/api/agenda/events",
    {
      method: "POST",
      body: request,
    },
  );
}

export async function completeAgendaOccurrence(
  occurrenceId: string,
  request: AgendaOccurrenceActionRequest = {},
) {
  return apiRequest<void>(
    `/api/agenda/occurrences/${occurrenceId}/complete`,
    {
      method: "PATCH",
      body: request,
    },
  );
}

export async function cancelAgendaOccurrence(
  occurrenceId: string,
  request: AgendaOccurrenceActionRequest = {},
) {
  return apiRequest<void>(
    `/api/agenda/occurrences/${occurrenceId}/cancel`,
    {
      method: "PATCH",
      body: request,
    },
  );
}

export async function duplicateAgendaOccurrence(
  occurrenceId: string,
  request?: DuplicateAgendaEventRequest,
) {
  return apiRequest<CreateAgendaEventResponse>(
    `/api/agenda/occurrences/${occurrenceId}/duplicate`,
    {
      method: "POST",
      body: request,
    },
  );
}

export async function deleteAgendaOccurrence(
  occurrenceId: string,
) {
  return apiRequest<void>(
    `/api/agenda/occurrences/${occurrenceId}`,
    {
      method: "DELETE",
    },
  );
}

export async function deleteAgendaEventSeries(
  eventId: string,
) {
  return apiRequest<void>(
    `/api/agenda/events/${eventId}`,
    {
      method: "DELETE",
    },
  );
}