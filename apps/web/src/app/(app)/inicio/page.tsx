import { DashboardOverview } from "@/features/dashboard/dashboard-overview";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Início",
};

export default function InicioPage() {
  return <DashboardOverview />;
}