"use client";

import { LoadingScreen } from "@/components/feedback/loading-screen";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();

  const {
    isAuthenticated,
    isLoading,
  } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    router.replace(
      isAuthenticated
        ? "/inicio"
        : "/login",
    );
  }, [
    isAuthenticated,
    isLoading,
    router,
  ]);

  return (
    <LoadingScreen message="Preparando seu Núcleo" />
  );
}