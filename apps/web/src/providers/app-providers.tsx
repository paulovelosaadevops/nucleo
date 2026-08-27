"use client";

import { AuthProvider } from "@/providers/auth-provider";
import { FeedbackProvider } from "@/providers/feedback-provider";
import type { ReactNode } from "react";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({
  children,
}: AppProvidersProps) {
  return (
    <AuthProvider>
      <FeedbackProvider>
        {children}
      </FeedbackProvider>
    </AuthProvider>
  );
}
