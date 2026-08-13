import { apiRequest } from "@/lib/api";
import type { FamilyMember } from "@/types/familyMember";

export const familyMemberService = {
  list(token: string) {
    return apiRequest<FamilyMember[]>("/family-members", {
      method: "GET",
      token,
    });
  },
};
