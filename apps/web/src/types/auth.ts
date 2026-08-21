export type FamilyRole = "OWNER" | "ADMIN" | "MEMBER";

export type MembershipStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "REMOVED"
  | "PENDING";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  status?: string;
  emailVerified?: boolean;
}

export interface AuthenticatedFamily {
  id: string;
  name: string;
  timeZone?: string;
  role: FamilyRole;
  membershipStatus?: MembershipStatus;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  user: AuthenticatedUser;
  family: AuthenticatedFamily;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  familyName?: string;
  invitationToken?: string;
}

export interface RegisterResponse {
  userId: string;
  familyId: string;
  name: string;
  email: string;
  familyName: string;
  role: FamilyRole;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}