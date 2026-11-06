import type { Metadata } from "next";
import Dashboard from "@/containers/Dashboard";
import { getDashboardForPage } from "@/services/server/dashboardService";

export const metadata: Metadata = { title: "Dashboard | HireFlow AI" };

export default async function DashboardPage() {
  const data = await getDashboardForPage();
  if (!data) throw new Error("The dashboard could not be loaded.");

  return <Dashboard data={data} />;
}
