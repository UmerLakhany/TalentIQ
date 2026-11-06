import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JobForm from "@/containers/JobForm";
import { getJobForPage } from "@/services/server/jobService";

export const metadata: Metadata = { title: "Edit Criteria | HireFlow AI" };

export default async function EditJob({ params }: PageProps<"/jobs/[id]/edit">) {
  const { id } = await params;
  const job = await getJobForPage(id);
  if (!job) notFound();

  // CVs already scored with the current criteria (drives the "re-analyze" notice in the form)
  const analyzedCount = job.cvSummary?.analyzed ?? 0;
  return <JobForm job={job} analyzedCount={analyzedCount} />;
}
