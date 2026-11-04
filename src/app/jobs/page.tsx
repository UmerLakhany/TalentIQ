import type { Metadata } from "next";
import JobsPage from "@/containers/Jobs";

export const metadata: Metadata = { title: "Jobs | HireFlow AI" };

export default function Jobs() {
  return <JobsPage />;
}
