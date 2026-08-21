import { apiRequest } from "@/lib/api/api-client";

import type {
  CreateFamilyInvitationRequest,
  FamilyInvitation,
  FamilyInvitationCreated,
  FamilyInvitationPreview,
  FamilyMember,
} from "@/types/family";

const FAMILY_BASE_PATH = "/api/family";
const INVITATION_BASE_PATH = "/api/invitations";

export const familyService = {
  members: {
    list(): Promise<FamilyMember[]> {
      return apiRequest<FamilyMember[]>(
        `${FAMILY_BASE_PATH}/members`,
      );
    },
  },

  invitations: {
    list(): Promise<FamilyInvitation[]> {
      return apiRequest<FamilyInvitation[]>(
        `${FAMILY_BASE_PATH}/invitations`,
      );
    },

    create(
      request: CreateFamilyInvitationRequest,
    ): Promise<FamilyInvitationCreated> {
      return apiRequest<FamilyInvitationCreated>(
        `${FAMILY_BASE_PATH}/invitations`,
        {
          method: "POST",
          body: request,
        },
      );
    },

    revoke(invitationId: string): Promise<void> {
      return apiRequest<void>(
        `${FAMILY_BASE_PATH}/invitations/${invitationId}`,
        {
          method: "DELETE",
        },
      );
    },

    preview(token: string): Promise<FamilyInvitationPreview> {
      return apiRequest<FamilyInvitationPreview>(
        `${INVITATION_BASE_PATH}/${encodeURIComponent(token)}`,
        {
          authenticated: false,
          retryOnUnauthorized: false,
        },
      );
    },

    decline(token: string): Promise<void> {
      return apiRequest<void>(
        `${INVITATION_BASE_PATH}/${encodeURIComponent(token)}/decline`,
        {
          method: "POST",
          authenticated: false,
          retryOnUnauthorized: false,
        },
      );
    },
  },
};