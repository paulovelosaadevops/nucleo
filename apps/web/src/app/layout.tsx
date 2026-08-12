import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NÚCLEO | Central da Família",
  description: "Sistema privado para organização familiar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
