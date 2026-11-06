import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JobDetails from "@/containers/JobDetails";
import { getCandidatesByJob } from "@/data/candidates";
import { getJobForPage } from "@/services/server/jobService";

export async function generateMetadata({ params }: PageProps<"/jobs/[id]">): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobForPage(id);
  return { title: `${job?.title ?? "Job"} | HireFlow AI` };
}

export default async function JobPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const job = await getJobForPage(id);
  if (!job) notFound();

  // Candidates are still static until the candidate APIs are connected
  return <JobDetails job={job} initialCandidates={getCandidatesByJob(id)} />;
}
