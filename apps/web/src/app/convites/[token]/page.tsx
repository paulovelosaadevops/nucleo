"use client";

import { useParams } from "next/navigation";

import { InvitationPreview } from "@/features/family/invitation-preview";

export default function InvitationPage() {
  const parameters = useParams<{ token: string }>();

  return (
    <InvitationPreview
      token={decodeURIComponent(parameters.token)}
    />
  );
}