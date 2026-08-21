import type {
  Metadata,
  Viewport,
} from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import { AppProviders } from "@/providers/app-providers";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Núcleo",
    template: "%s | Núcleo",
  },
  description:
    "A central operacional da sua família.",
  applicationName: "Núcleo",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Núcleo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
    >
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          nucleo-noise
          min-h-screen
          antialiased
        `}
      >
        <div className="nucleo-grid min-h-screen">
          <AppProviders>
            {children}
          </AppProviders>
        </div>
      </body>
    </html>
  );
}