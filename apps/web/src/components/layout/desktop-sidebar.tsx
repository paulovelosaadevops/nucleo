"use client";

import { BrandMark } from "@/components/ui/brand-mark";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/cn";

import {
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  LayoutDashboard,
  LogOut,
  Settings,
  ShoppingBasket,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import { useState } from "react";

const primaryNavigation = [
  {
    label: "Início",
    href: "/inicio",
    icon: LayoutDashboard,
  },
  {
    label: "Agenda",
    href: "/agenda",
    icon: CalendarDays,
  },
  {
    label: "Compras",
    href: "/compras",
    icon: ShoppingBasket,
  },
  {
    label: "Finanças",
    href: "/financas",
    icon: ChartNoAxesCombined,
  },
];

const familyNavigation = [
  {
    label: "Notificações",
    href: "/notificacoes",
    icon: Bell,
  },
  {
    label: "Família",
    href: "/familia",
    icon: UsersRound,
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

function isActiveRoute(
  pathname: string,
  href: string,
): boolean {
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();

  const [loggingOut, setLoggingOut] =
    useState(false);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const initials = session?.user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  const roleLabel =
    session?.family.role === "OWNER"
      ? "Proprietário"
      : session?.family.role === "ADMIN"
        ? "Administrador"
        : "Membro";

  return (
    <aside
      className="
        fixed
        inset-y-0
        left-0
        z-40
        hidden
        w-72
        overflow-hidden
        border-r
        border-white/[0.075]
        bg-[#070708]/90
        shadow-[18px_0_60px_rgba(0,0,0,0.22)]
        backdrop-blur-3xl
        lg:flex
        lg:flex-col
      "
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-28
          -top-32
          h-80
          w-80
          rounded-full
          bg-white/[0.055]
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-y-0
          right-0
          w-px
          bg-gradient-to-b
          from-transparent
          via-white/[0.09]
          to-transparent
        "
      />

      <div className="relative z-10 px-7 pb-7 pt-8">
        <BrandMark />
      </div>

      <div
        className="
          relative
          z-10
          mx-5
          mb-6
          overflow-hidden
          rounded-2xl
          border
          border-white/[0.085]
          bg-gradient-to-br
          from-white/[0.065]
          to-white/[0.018]
          p-4
          shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]
        "
      >
        <div
          aria-hidden="true"
          className="
            absolute
            -right-8
            -top-8
            h-24
            w-24
            rounded-full
            bg-white/[0.035]
            blur-2xl
          "
        />

        <p className="relative truncate text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Seu núcleo
        </p>

        <p className="relative mt-2 truncate text-sm font-medium text-zinc-200">
          {session?.family.name}
        </p>
      </div>

      <nav className="relative z-10 flex-1 overflow-y-auto px-4">
        <NavigationGroup
          pathname={pathname}
          items={primaryNavigation}
        />

        <div className="my-5 border-t border-white/[0.055]" />

        <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-zinc-700">
          Gestão familiar
        </p>

        <NavigationGroup
          pathname={pathname}
          items={familyNavigation}
        />
      </nav>

      <div className="relative z-10 border-t border-white/[0.065] bg-black/20 p-4 backdrop-blur-xl">
        <div
          className="
            flex
            items-center
            gap-3
            rounded-2xl
            border
            border-transparent
            p-2
            transition
            hover:border-white/[0.065]
            hover:bg-white/[0.025]
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-white/[0.12]
              bg-gradient-to-br
              from-zinc-500/45
              via-zinc-800/45
              to-zinc-950
              text-xs
              font-semibold
              text-white
              shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
            "
          >
            {initials || "NU"}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-200">
              {session?.user.name}
            </p>

            <p className="mt-0.5 truncate text-xs text-zinc-600">
              {roleLabel}
            </p>
          </div>

          <button
            type="button"
            disabled={loggingOut}
            onClick={handleLogout}
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-transparent
              text-zinc-600
              transition
              hover:border-white/[0.075]
              hover:bg-white/[0.055]
              hover:text-white
              disabled:opacity-40
            "
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

interface NavigationGroupProps {
  pathname: string;
  items: typeof primaryNavigation;
}

function NavigationGroup({
  pathname,
  items,
}: NavigationGroupProps) {
  return (
    <div className="space-y-1.5">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActiveRoute(
          pathname,
          item.href,
        );

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={
              active ? "page" : undefined
            }
            className={cn(
              `
                group
                relative
                flex
                h-11
                items-center
                gap-3
                overflow-hidden
                rounded-xl
                border
                px-3
                text-sm
                font-medium
                transition
                duration-200
              `,
              active
                ? `
                    border-white/[0.10]
                    bg-white/[0.075]
                    text-white
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_8px_24px_rgba(0,0,0,0.16)]
                  `
                : `
                    border-transparent
                    text-zinc-500
                    hover:border-white/[0.055]
                    hover:bg-white/[0.035]
                    hover:text-zinc-200
                  `,
            )}
          >
            {active && (
              <>
                <span
                  aria-hidden="true"
                  className="
                    absolute
                    inset-y-2
                    left-0
                    w-0.5
                    rounded-r-full
                    bg-zinc-200
                    shadow-[0_0_10px_rgba(255,255,255,0.45)]
                  "
                />

                <span
                  aria-hidden="true"
                  className="
                    absolute
                    -left-8
                    top-1/2
                    h-16
                    w-16
                    -translate-y-1/2
                    rounded-full
                    bg-white/[0.055]
                    blur-xl
                  "
                />
              </>
            )}

            <Icon
              className={cn(
                "relative h-[1.1rem] w-[1.1rem] transition-colors",
                active
                  ? "text-zinc-100"
                  : "text-zinc-600 group-hover:text-zinc-300",
              )}
            />

            <span className="relative">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}