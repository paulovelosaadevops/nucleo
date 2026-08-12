"use client";

import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";

export function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <button className="logoutButton" type="button" onClick={handleLogout}>
      Sair
    </button>
  );
}
