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
    "Central familiar privada para agenda, compras, finanças e rotina da família.",
  applicationName: "Núcleo | Central Familiar",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Núcleo",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
          min-h-dvh
          antialiased
        `}
      >
        <div className="nucleo-grid min-h-dvh">
          <AppProviders>
            {children}
          </AppProviders>
        </div>
      </body>
    </html>
  );
}
