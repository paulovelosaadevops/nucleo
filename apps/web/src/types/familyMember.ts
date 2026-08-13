export type FamilyMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "OWNER" | "MEMBER";
  createdAt: string;
};
