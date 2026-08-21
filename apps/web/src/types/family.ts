export type FamilyRole = "OWNER" | "ADMIN" | "MEMBER";

export type MembershipStatus = "ACTIVE" | "INACTIVE";

export type InvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "REVOKED"
  | "EXPIRED";

export interface FamilyMember {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: FamilyRole;
  status: MembershipStatus;
  joinedAt: string;
  currentUser: boolean;
}

export interface InvitationAuthor {
  id: string;
  name: string;
}

export interface FamilyInvitation {
  id: string;
  email: string;
  role: FamilyRole;
  status: InvitationStatus;
  expiresAt: string;
  respondedAt: string | null;
  createdAt: string;
  invitedBy: InvitationAuthor;
}

export interface CreateFamilyInvitationRequest {
  email: string;
  role: FamilyRole;
}

export interface FamilyInvitationCreated {
  invitation: FamilyInvitation;
  invitationToken: string;
  invitationUrl: string;
}

export interface FamilyInvitationPreview {
  invitationId: string;
  familyName: string;
  maskedEmail: string;
  role: FamilyRole;
  status: InvitationStatus;
  invitedByName: string;
  expiresAt: string;
}

export type FamilySection =
  | "overview"
  | "members"
  | "invitations";