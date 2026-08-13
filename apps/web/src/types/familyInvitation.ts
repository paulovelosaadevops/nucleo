export type FamilyInvitation = {
  id: string;
  invitedEmail: string;
  role: "OWNER" | "MEMBER";
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  token: string;
  createdAt: string;
};

export type CreateFamilyInvitationRequest = {
  invitedEmail: string;
  role: "MEMBER";
};
