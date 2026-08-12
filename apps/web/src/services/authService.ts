import { apiRequest } from "@/lib/api";
import type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
} from "@/types/auth";

export const authService = {
  login(payload: LoginRequest) {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: payload,
    });
  },

  register(payload: RegisterRequest) {
    return apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: payload,
    });
  },

  forgotPassword(payload: ForgotPasswordRequest) {
    return apiRequest<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: payload,
    });
  },
};
