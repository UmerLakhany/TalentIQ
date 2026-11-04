import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JobDetails from "@/containers/JobDetails";
import { getCandidatesByJob } from "@/data/candidates";
import { getJobById, mockJobs } from "@/data/jobs";

export function generateStaticParams() {
  return mockJobs.map((job) => ({ id: job.id }));
}

export async function generateMetadata({ params }: PageProps<"/jobs/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `${getJobById(id)?.title ?? "Job"} | HireFlow AI` };
}

export default async function JobPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const job = getJobById(id);
  if (!job) notFound();

  return <JobDetails job={job} initialCandidates={getCandidatesByJob(id)} />;
}
