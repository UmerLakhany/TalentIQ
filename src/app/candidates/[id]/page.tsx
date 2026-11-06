import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CandidateEvaluation from "@/containers/CandidateEvaluation";
import { getCandidateForPage } from "@/services/server/candidateService";

export async function generateMetadata({ params }: PageProps<"/candidates/[id]">): Promise<Metadata> {
  const { id } = await params;
  const candidate = await getCandidateForPage(id);
  return { title: `${candidate?.profile?.name ?? "Candidate"} | HireFlow AI` };
}

export default async function CandidatePage({ params }: PageProps<"/candidates/[id]">) {
  const { id } = await params;
  const candidate = await getCandidateForPage(id);

  // Only analyzed CVs have an evaluation page (queued / processing / failed ones stay in the ranking)
  if (!candidate || candidate.status !== "completed" || !candidate.profile || !candidate.evaluation) {
    notFound();
  }

  const { job, ...rest } = candidate;
  return <CandidateEvaluation job={job} candidate={{ ...rest, profile: candidate.profile, evaluation: candidate.evaluation }} />;
}
