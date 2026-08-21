import { Users } from "lucide-react";

import { FamilyMemberCard } from "./family-member-card";

import type { FamilyMember } from "@/types/family";

interface FamilyMembersProps {
  members: FamilyMember[];
}

export function FamilyMembers({
  members,
}: FamilyMembersProps) {
  const activeMembers = members.filter(
    (member) => member.status === "ACTIVE",
  );

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-semibold text-white">
          Membros do núcleo
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          {activeMembers.length}{" "}
          {activeMembers.length === 1
            ? "membro ativo"
            : "membros ativos"}
        </p>
      </div>

      {members.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
          <Users className="size-8 text-zinc-600" />

          <p className="mt-4 font-medium text-zinc-300">
            Nenhum membro encontrado
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {members.map((member) => (
            <FamilyMemberCard
              key={member.membershipId}
              member={member}
            />
          ))}
        </div>
      )}
    </section>
  );
}