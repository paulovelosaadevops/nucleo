"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  LoaderCircle,
  MailPlus,
  RefreshCw,
} from "lucide-react";

import { FamilyInvitations } from "./family-invitations";
import { FamilyMembers } from "./family-members";
import { FamilyNavigation } from "./family-navigation";
import { FamilyOverview } from "./family-overview";
import { familyService } from "./family-service";

import type {
  CreateFamilyInvitationRequest,
  FamilyInvitation,
  FamilyInvitationCreated,
  FamilyMember,
  FamilySection,
} from "@/types/family";

export function FamilyPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [invitations, setInvitations] = useState<
    FamilyInvitation[]
  >([]);

  const [activeSection, setActiveSection] =
    useState<FamilySection>("overview");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentMember = useMemo(
    () => members.find((member) => member.currentUser),
    [members],
  );

  const pendingInvitations = useMemo(
    () =>
      invitations.filter(
        (invitation) => invitation.status === "PENDING",
      ).length,
    [invitations],
  );

  const loadFamily = useCallback(
    async (background = false) => {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const [memberResult, invitationResult] =
          await Promise.all([
            familyService.members.list(),
            familyService.invitations.list(),
          ]);

        setMembers(memberResult);
        setInvitations(invitationResult);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar o núcleo familiar.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadFamily();
  }, [loadFamily]);

  async function createInvitation(
    request: CreateFamilyInvitationRequest,
  ): Promise<FamilyInvitationCreated> {
    setSubmitting(true);
    setError(null);

    try {
      const response =
        await familyService.invitations.create(request);

      setInvitations((current) => [
        response.invitation,
        ...current,
      ]);

      return response;
    } finally {
      setSubmitting(false);
    }
  }

  async function revokeInvitation(invitationId: string) {
    setActionId(invitationId);
    setError(null);

    try {
      await familyService.invitations.revoke(invitationId);
      await loadFamily(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível revogar o convite.",
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            <span className="size-1.5 rounded-full bg-white" />
            Central familiar
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Família
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Pessoas, acessos e convites do seu núcleo familiar.
          </p>
        </div>

        <button
          type="button"
          disabled={refreshing}
          onClick={() => void loadFamily(true)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-50"
        >
          <RefreshCw
            className={[
              "size-4",
              refreshing ? "animate-spin" : "",
            ].join(" ")}
          />
          Atualizar
        </button>
      </header>

      <FamilyNavigation
        activeSection={activeSection}
        pendingInvitations={pendingInvitations}
        onSectionChange={setActiveSection}
      />

      {error ? (
        <div className="flex gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-4 text-sm text-rose-200">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/[0.025]">
          <LoaderCircle className="size-7 animate-spin text-zinc-500" />
        </div>
      ) : null}

      {!loading && !currentMember ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 p-6 text-center">
          <MailPlus className="size-8 text-zinc-600" />

          <p className="mt-4 font-medium text-zinc-300">
            Não foi possível identificar sua participação
          </p>

          <p className="mt-2 text-sm text-zinc-600">
            Atualize a página ou entre novamente na aplicação.
          </p>
        </div>
      ) : null}

      {!loading && currentMember ? (
        <>
          {activeSection === "overview" ? (
            <FamilyOverview
              members={members}
              invitations={invitations}
              onOpenMembers={() =>
                setActiveSection("members")
              }
              onOpenInvitations={() =>
                setActiveSection("invitations")
              }
            />
          ) : null}

          {activeSection === "members" ? (
            <FamilyMembers members={members} />
          ) : null}

          {activeSection === "invitations" ? (
            <FamilyInvitations
              invitations={invitations}
              currentRole={currentMember.role}
              submitting={submitting}
              actionId={actionId}
              onCreate={createInvitation}
              onRevoke={revokeInvitation}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}