import { BrandSignature } from "@/components/brand/BrandSignature";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { LogoutButton } from "@/components/ui/LogoutButton";

type AppShellProps = {
  children: React.ReactNode;
  active: "dashboard" | "financas" | "compras" | "agenda" | "rotinas" | "familia";
};

const links = [
  { key: "dashboard", label: "Visão geral", href: "/dashboard" },
  { key: "financas", label: "Finanças", href: "/financas" },
  { key: "compras", label: "Compras", href: "/compras" },
  { key: "agenda", label: "Agenda", href: "/agenda" },
  { key: "rotinas", label: "Rotinas", href: "/rotinas" },
  { key: "familia", label: "Família", href: "/familia" },
] as const;

export function AppShell({ children, active }: AppShellProps) {
  return (
    <AuthGuard>
      <main className="dashboardPage">
        <div className="dashboardGlow" />

        <aside className="sidebar">
          <BrandSignature size="sm" />

          <nav className="sidebarNav">
            {links.map((link) => (
              <a
                key={link.key}
                className={active === link.key ? "active" : ""}
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="sidebarFooter">
            <LogoutButton />
          </div>
        </aside>

        <section className="dashboardContent">{children}</section>
      </main>
    </AuthGuard>
  );
}
