"use client";

import {
  Bell,
  House,
  ScrollText,
  UserRound,
} from "lucide-react";

import type {
  SettingsSection,
} from "@/types/settings";

interface SettingsNavigationProps {
  activeSection: SettingsSection;
  onSectionChange: (
    section: SettingsSection,
  ) => void;
}

interface NavigationItem {
  id: SettingsSection;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    id: "profile",
    label: "Perfil",
    description: "Sua conta e acesso",
    icon: (
      <UserRound
        aria-hidden="true"
        className="size-5"
      />
    ),
  },
  {
    id: "family",
    label: "Núcleo",
    description: "Dados da família",
    icon: (
      <House
        aria-hidden="true"
        className="size-5"
      />
    ),
  },
  {
    id: "notifications",
    label: "Notificações",
    description: "Alertas e preferências",
    icon: (
      <Bell
        aria-hidden="true"
        className="size-5"
      />
    ),
  },
  {
    id: "audit",
    label: "Atividades",
    description: "Histórico do núcleo",
    icon: (
      <ScrollText
        aria-hidden="true"
        className="size-5"
      />
    ),
  },
];

export function SettingsNavigation({
  activeSection,
  onSectionChange,
}: SettingsNavigationProps) {
  return (
    <nav
      aria-label="Seções das configurações"
      className={[
        "grid grid-cols-2 gap-2",
        "lg:grid-cols-1",
      ].join(" ")}
    >
      {navigationItems.map((item) => {
        const active =
          activeSection === item.id;

        return (
          <button
            key={item.id}
            type="button"
            aria-current={
              active ? "page" : undefined
            }
            onClick={() =>
              onSectionChange(item.id)
            }
            className={[
              "group flex min-h-20",
              "items-center gap-3",
              "rounded-2xl border p-3",
              "text-left transition",
              "sm:p-4",
              active
                ? [
                    "border-white/20",
                    "bg-white text-black",
                    "shadow-[0_18px_50px_rgba(0,0,0,0.28)]",
                  ].join(" ")
                : [
                    "border-white/10",
                    "bg-white/[0.025]",
                    "text-zinc-400",
                    "hover:border-white/20",
                    "hover:bg-white/[0.055]",
                    "hover:text-white",
                  ].join(" "),
            ].join(" ")}
          >
            <span
              className={[
                "flex size-10 shrink-0",
                "items-center justify-center",
                "rounded-xl border",
                active
                  ? [
                      "border-black/10",
                      "bg-black text-white",
                    ].join(" ")
                  : [
                      "border-white/10",
                      "bg-white/[0.035]",
                      "text-zinc-400",
                    ].join(" "),
              ].join(" ")}
            >
              {item.icon}
            </span>

            <span className="min-w-0">
              <span className="block text-sm font-semibold">
                {item.label}
              </span>

              <span
                className={[
                  "mt-0.5 hidden text-xs",
                  "sm:block",
                  active
                    ? "text-zinc-600"
                    : "text-zinc-600",
                ].join(" ")}
              >
                {item.description}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}