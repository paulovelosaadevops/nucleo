export type PublicFamilyInvitation = {
  id: string;
  familyName: string;
  invitedEmail: string;
  role: "OWNER" | "MEMBER";
  status: "PENDING" | "ACCEPTED" | "REVOKED";
};

export type AcceptFamilyInvitationRequest = {
  name: string;
  password: string;
};
