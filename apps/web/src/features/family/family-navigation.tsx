"use client";

import {
  LayoutDashboard,
  MailPlus,
  Users,
} from "lucide-react";

import type { FamilySection } from "@/types/family";

interface FamilyNavigationProps {
  activeSection: FamilySection;
  pendingInvitations: number;
  onSectionChange: (section: FamilySection) => void;
}

const items: Array<{
  value: FamilySection;
  label: string;
  icon: typeof Users;
}> = [
  {
    value: "overview",
    label: "Visão geral",
    icon: LayoutDashboard,
  },
  {
    value: "members",
    label: "Membros",
    icon: Users,
  },
  {
    value: "invitations",
    label: "Convites",
    icon: MailPlus,
  },
];

export function FamilyNavigation({
  activeSection,
  pendingInvitations,
  onSectionChange,
}: FamilyNavigationProps) {
  return (
    <nav
      aria-label="Navegação do núcleo familiar"
      className="overflow-x-auto pb-1"
    >
      <div className="flex min-w-max gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.value;

          return (
            <button
              key={item.value}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onSectionChange(item.value)}
              className={[
                "inline-flex h-11 items-center gap-2 rounded-2xl border px-4",
                "text-sm font-medium transition-all",
                active
                  ? "border-white bg-white text-black"
                  : "border-white/10 bg-white/[0.035] text-zinc-400 hover:bg-white/[0.07] hover:text-white",
              ].join(" ")}
            >
              <Icon className="size-4" />

              {item.label}

              {item.value === "invitations" &&
              pendingInvitations > 0 ? (
                <span
                  className={[
                    "flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    active
                      ? "bg-black text-white"
                      : "bg-white text-black",
                  ].join(" ")}
                >
                  {pendingInvitations}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}