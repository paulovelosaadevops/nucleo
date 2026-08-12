import Link from "next/link";
import type { ReactNode } from "react";

type AppButtonProps = {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  type?: "button" | "submit";
};

export function AppButton({
  href,
  children,
  variant = "primary",
  type = "button",
}: AppButtonProps) {
  const className = `appButton appButton-${variant}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={className}>
      {children}
    </button>
  );
}
