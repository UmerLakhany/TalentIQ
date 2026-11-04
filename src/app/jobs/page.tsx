import type { Metadata } from "next";
import JobsPage from "@/containers/Jobs";

export const metadata: Metadata = { title: "Job Management | HireFlow AI" };

export default function Jobs() {
  return <JobsPage />;
}
