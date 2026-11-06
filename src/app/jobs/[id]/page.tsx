import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JobDetails from "@/containers/JobDetails";
import { getJobForPage } from "@/services/server/jobService";
import { getJobCandidatesForPage } from "@/services/server/candidateService";

export async function generateMetadata({ params }: PageProps<"/jobs/[id]">): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobForPage(id);
  return { title: `${job?.title ?? "Job"} | HireFlow AI` };
}

export default async function JobPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const [job, candidates] = await Promise.all([getJobForPage(id), getJobCandidatesForPage(id)]);
  if (!job) notFound();

  return <JobDetails job={job} initialCandidates={candidates?.candidates ?? []} />;
}
