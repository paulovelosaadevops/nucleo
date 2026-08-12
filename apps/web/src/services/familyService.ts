import { apiRequest } from "@/lib/api";
import type { CurrentFamily } from "@/types/family";

export const familyService = {
  current(token: string) {
    return apiRequest<CurrentFamily>("/families/current", {
      method: "GET",
      token,
    });
  },
};
