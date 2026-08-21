import { apiRequest } from "@/lib/api/api-client";

import type {
  AuditEvent,
  AuditPageResponse,
  AuditSearchParams,
} from "@/types/audit";

const AUDIT_EVENTS_PATH =
  "/api/audit-events";

function appendOptionalParameter(
  query: URLSearchParams,
  name: string,
  value: string | undefined,
) {
  if (value && value.trim()) {
    query.set(name, value.trim());
  }
}

function buildAuditQuery(
  params: AuditSearchParams = {},
): string {
  const query = new URLSearchParams();

  appendOptionalParameter(
    query,
    "actorUserId",
    params.actorUserId,
  );

  appendOptionalParameter(
    query,
    "action",
    params.action,
  );

  appendOptionalParameter(
    query,
    "resourceType",
    params.resourceType,
  );

  appendOptionalParameter(
    query,
    "resourceId",
    params.resourceId,
  );

  appendOptionalParameter(
    query,
    "from",
    params.from,
  );

  appendOptionalParameter(
    query,
    "to",
    params.to,
  );

  query.set(
    "page",
    String(params.page ?? 0),
  );

  query.set(
    "size",
    String(params.size ?? 20),
  );

  query.set(
    "sort",
    params.sort ?? "occurredAt,desc",
  );

  return query.toString();
}

export const auditService = {
  search(
    params: AuditSearchParams = {},
  ): Promise<AuditPageResponse<AuditEvent>> {
    const query = buildAuditQuery(params);

    return apiRequest<
      AuditPageResponse<AuditEvent>
    >(`${AUDIT_EVENTS_PATH}?${query}`);
  },
};