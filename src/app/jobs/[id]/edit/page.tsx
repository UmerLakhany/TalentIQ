import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JobForm from "@/containers/JobForm";
import { getCandidatesByJob } from "@/data/candidates";
import { getJobById, mockJobs } from "@/data/jobs";

export const metadata: Metadata = { title: "Edit Criteria | HireFlow AI" };

export function generateStaticParams() {
  return mockJobs.map((job) => ({ id: job.id }));
}

export default async function EditJob({ params }: PageProps<"/jobs/[id]/edit">) {
  const { id } = await params;
  const job = getJobById(id);
  if (!job) notFound();

  const analyzedCount = getCandidatesByJob(id).filter((c) => c.status === "completed").length;
  return <JobForm job={job} analyzedCount={analyzedCount} />;
}
