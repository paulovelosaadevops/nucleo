import { apiRequest } from "@/lib/api";
import type { AuthResponse } from "@/types/auth";
import type {
  AcceptFamilyInvitationRequest,
  PublicFamilyInvitation,
} from "@/types/publicFamilyInvitation";

export const publicFamilyInvitationService = {
  findByToken(token: string) {
    return apiRequest<PublicFamilyInvitation>(
      `/public/family-invitations/${token}`
    );
  },

  accept(token: string, payload: AcceptFamilyInvitationRequest) {
    return apiRequest<AuthResponse>(
      `/public/family-invitations/${token}/accept`,
      {
        method: "POST",
        body: payload,
      }
    );
  },
};
