"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/session";
import { familyMemberService } from "@/services/familyMemberService";
import type { FamilyMember } from "@/types/familyMember";

export function useFamilyMembers() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState("");

  async function loadMembers() {
    const token = getAccessToken();

    if (!token) {
      setIsLoadingMembers(false);
      return;
    }

    setIsLoadingMembers(true);
    setMembersError("");

    try {
      const data = await familyMemberService.list(token);
      setMembers(data);
    } catch {
      setMembersError("Não foi possível carregar os membros.");
    } finally {
      setIsLoadingMembers(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  return {
    members,
    isLoadingMembers,
    membersError,
    reloadMembers: loadMembers,
  };
}
