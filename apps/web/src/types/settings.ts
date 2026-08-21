export type UserStatus =
  | "ACTIVE"
  | "BLOCKED"
  | "DISABLED";

export type FamilyRole =
  | "OWNER"
  | "ADMIN"
  | "MEMBER";

export interface CurrentUserFamily {
  id: string;
  name: string;
  role: FamilyRole;
  joinedAt: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  emailVerified: boolean;
  family: CurrentUserFamily;
}

export interface FamilySettings {
  id: string;
  name: string;
  timeZone: string;
  currentUserRole: FamilyRole;
  canManage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateFamilySettingsRequest {
  name: string;
  timeZone: string;
}

export type SettingsSection =
  | "profile"
  | "family"
  | "notifications"
  | "audit";