"use client";

import { cn } from "@/lib/cn";

import {
  CalendarDays,
  ChartNoAxesCombined,
  House,
  ShoppingBasket,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    label: "Início",
    href: "/inicio",
    icon: House,
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
  {
    label: "Família",
    href: "/familia",
    icon: UsersRound,
  },
];

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="
        safe-area-bottom
        fixed
        inset-x-3
        bottom-3
        z-50
        overflow-hidden
        rounded-[1.4rem]
        border
        border-white/[0.10]
        bg-[#09090a]/82
        p-1.5
        shadow-[0_20px_60px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.055)]
        backdrop-blur-3xl
        lg:hidden
      "
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-8
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-white/[0.16]
          to-transparent
        "
      />

      <div className="relative mx-auto grid max-w-xl grid-cols-5 gap-1">
        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            pathname.startsWith(
              `${item.href}/`,
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
                  relative
                  flex
                  min-h-14
                  flex-col
                  items-center
                  justify-center
                  gap-1
                  overflow-hidden
                  rounded-2xl
                  border
                  text-[0.62rem]
                  font-medium
                  transition
                  duration-200
                `,
                active
                  ? `
                      border-white/[0.09]
                      bg-white/[0.075]
                      text-white
                      shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]
                    `
                  : `
                      border-transparent
                      text-zinc-600
                      active:bg-white/[0.05]
                    `,
              )}
            >
              {active && (
                <>
                  <span
                    aria-hidden="true"
                    className="
                      absolute
                      left-1/2
                      top-0
                      h-0.5
                      w-5
                      -translate-x-1/2
                      rounded-full
                      bg-zinc-200
                      shadow-[0_0_10px_rgba(255,255,255,0.5)]
                    "
                  />

                  <span
                    aria-hidden="true"
                    className="
                      absolute
                      left-1/2
                      top-0
                      h-8
                      w-10
                      -translate-x-1/2
                      rounded-full
                      bg-white/[0.055]
                      blur-lg
                    "
                  />
                </>
              )}

              <Icon
                className={cn(
                  "relative h-5 w-5 transition",
                  active
                    ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.28)]"
                    : "text-zinc-600",
                )}
              />

              <span className="relative">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}