"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasSession } from "@/lib/session";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!hasSession()) {
      router.replace("/login");
      return;
    }

    setIsChecking(false);
  }, [router]);

  if (isChecking) {
    return (
      <main className="authPage">
        <div className="heroBackground" />
        <div className="loadingState">Validando acesso ao NÚCLEO...</div>
      </main>
    );
  }

  return children;
}
