"use client";

import { LoadingScreen } from "@/components/feedback/loading-screen";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { BrandMark } from "@/components/ui/brand-mark";
import { useAuth } from "@/hooks/use-auth";

import {
  Bell,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  type ReactNode,
} from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({
  children,
}: AppShellProps) {
  const router = useRouter();

  const {
    session,
    isAuthenticated,
    isLoading,
  } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [
    isAuthenticated,
    isLoading,
    router,
  ]);

  if (isLoading) {
    return (
      <LoadingScreen message="Carregando sua central" />
    );
  }

  if (!isAuthenticated || !session) {
    return (
      <LoadingScreen message="Redirecionando" />
    );
  }

  const firstName =
    session.user.name
      .trim()
      .split(/\s+/)[0] || "Família";

  return (
    <div
      className="relative isolate min-h-screen overflow-x-hidden bg-[#050505]"
      style={{
        backgroundImage: `
          radial-gradient(
            circle at 14% -5%,
            rgba(255, 255, 255, 0.075),
            transparent 28rem
          ),
          radial-gradient(
            circle at 92% 12%,
            rgba(113, 113, 122, 0.055),
            transparent 30rem
          ),
          linear-gradient(
            180deg,
            #080809 0%,
            #050505 48%,
            #030303 100%
          )
        `,
      }}
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-16
          z-0
          h-56
          opacity-60
          [mask-image:linear-gradient(to_bottom,black,transparent)]
          [-webkit-mask-image:linear-gradient(to_bottom,black,transparent)]
        "
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(255, 255, 255, 0.018) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.018) 1px,
              transparent 1px
            )
          `,
          backgroundSize: "2.5rem 2.5rem",
        }}
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-[18%]
          top-24
          z-0
          h-72
          w-72
          rounded-full
          bg-white/[0.025]
          blur-3xl
        "
      />

      <DesktopSidebar />

      <div className="relative z-10 lg:pl-72">
        <header
          className="
            sticky
            top-0
            z-30
            border-b
            border-white/[0.075]
            bg-[#080809]/75
            shadow-[0_12px_40px_rgba(0,0,0,0.22)]
            backdrop-blur-3xl
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-x-0
              top-0
              h-px
              bg-gradient-to-r
              from-transparent
              via-white/[0.12]
              to-transparent
            "
          />

          <div className="mx-auto flex h-16 max-w-[100rem] items-center justify-between px-4 sm:px-6 lg:h-18 lg:px-8">
            <div className="lg:hidden">
              <BrandMark compact />
            </div>

            <div className="hidden lg:block">
              <p className="text-xs text-zinc-600">
                Olá, {firstName}
              </p>

              <p className="mt-0.5 text-sm font-medium text-zinc-300">
                {session.family.name}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/notificacoes"
                className="
                  relative
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-white/[0.075]
                  bg-white/[0.035]
                  text-zinc-500
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
                  transition
                  hover:border-white/[0.13]
                  hover:bg-white/[0.07]
                  hover:text-white
                "
                aria-label="Notificações"
              >
                <Bell className="h-[1.15rem] w-[1.15rem]" />
              </Link>

              <Link
                href="/configuracoes"
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-white/[0.075]
                  bg-white/[0.035]
                  text-zinc-500
                  transition
                  hover:border-white/[0.13]
                  hover:bg-white/[0.07]
                  hover:text-white
                  lg:hidden
                "
                aria-label="Configurações"
              >
                <Settings className="h-[1.15rem] w-[1.15rem]" />
              </Link>

              <Link
                href="/familia"
                className="
                  ml-0.5
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-white/[0.12]
                  bg-gradient-to-br
                  from-zinc-500/40
                  via-zinc-800/40
                  to-zinc-950
                  text-[0.65rem]
                  font-semibold
                  text-white
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
                  lg:hidden
                "
                aria-label="Perfil e família"
              >
                {firstName
                  .charAt(0)
                  .toUpperCase()}
              </Link>
            </div>
          </div>
        </header>

        <main
          className="
            relative
            mx-auto
            min-h-[calc(100vh-4rem)]
            max-w-[100rem]
            px-4
            pb-28
            pt-6
            sm:px-6
            sm:pt-8
            lg:px-8
            lg:pb-12
          "
        >
          {children}
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}