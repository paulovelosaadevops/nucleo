import { apiRequest } from "@/lib/api";
import type { CurrentUser } from "@/types/user";

export const userService = {
  me(token: string) {
    return apiRequest<CurrentUser>("/users/me", {
      method: "GET",
      token,
    });
  },
};
