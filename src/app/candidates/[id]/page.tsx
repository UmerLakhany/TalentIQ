import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CandidateEvaluation from "@/containers/CandidateEvaluation";
import { getCandidateById, mockCandidates } from "@/data/candidates";
import { getJobById } from "@/data/jobs";

// Only analyzed candidates have an evaluation page
export function generateStaticParams() {
  return mockCandidates.filter((c) => c.status === "completed").map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/candidates/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `${getCandidateById(id)?.profile?.name ?? "Candidate"} | HireFlow AI` };
}

export default async function CandidatePage({ params }: PageProps<"/candidates/[id]">) {
  const { id } = await params;
  const candidate = getCandidateById(id);
  const job = candidate ? getJobById(candidate.jobId) : undefined;

  if (!candidate || !job || candidate.status !== "completed" || !candidate.profile || !candidate.evaluation) {
    notFound();
  }

  return (
    <CandidateEvaluation
      job={job}
      candidate={{ ...candidate, profile: candidate.profile, evaluation: candidate.evaluation }}
    />
  );
}
