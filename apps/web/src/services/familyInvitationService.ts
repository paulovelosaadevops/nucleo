import { apiRequest } from "@/lib/api";
import type {
  CreateFamilyInvitationRequest,
  FamilyInvitation,
} from "@/types/familyInvitation";

export const familyInvitationService = {
  list(token: string) {
    return apiRequest<FamilyInvitation[]>("/family-invitations", {
      method: "GET",
      token,
    });
  },

  create(token: string, payload: CreateFamilyInvitationRequest) {
    return apiRequest<FamilyInvitation>("/family-invitations", {
      method: "POST",
      token,
      body: payload,
    });
  },
};
