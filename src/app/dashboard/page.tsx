import type { Metadata } from "next";
import Dashboard from "@/containers/Dashboard";
import { mockCandidates } from "@/data/candidates";
import { mockJobs } from "@/data/jobs";

export const metadata: Metadata = { title: "Dashboard | HireFlow AI" };

export default function DashboardPage() {
  return <Dashboard jobs={mockJobs} candidates={mockCandidates} />;
}
