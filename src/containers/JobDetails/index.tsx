"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorToaster, SuccessToaster } from "@/components/Toaster";
import PageHeader from "@/core/comman/PageHeader";
import StatCard from "@/core/comman/StatCard";
import type { Candidate, CvFileType } from "@/data/candidates";
import type { Job } from "@/data/jobs";
import ConfirmDialog from "@/core/modals/ConfirmDialog";
import { deleteCandidate, getJobCandidates, retryCandidate, uploadCvs } from "@/services/candidateService";
import { formatDate } from "@/utils/format";
import CandidateRanking from "./components/CandidateRanking";
import CriteriaSummary from "./components/CriteriaSummary";
import CvUploader from "./components/CvUploader";

/** How often to check for status changes while CVs are being analyzed. */
const STATUS_POLL_MS = 5000;

interface JobDetailsProps {
  job: Job;
  initialCandidates: Candidate[];
}

/**
 * CV workflow on this page:
 *   1. Recruiter uploads CVs          → POST /jobs/:id/cvs (stored, one RabbitMQ job per CV, status "queued")
 *   2. Background worker + AI analysis (backend) → status "processing" → "completed" / "failed"
 *   3. This page re-reads GET /jobs/:id/candidates every few seconds while any CV is queued or
 *      processing, so statuses, scores and the ranking update without a reload.
 */
export default function JobDetails({ job, initialCandidates }: JobDetailsProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const stats = {
    total: candidates.length,
    analyzed: candidates.filter((c) => c.status === "completed").length,
    inProgress: candidates.filter((c) => c.status === "queued" || c.status === "processing").length,
    failed: candidates.filter((c) => c.status === "failed").length,
  };
  const analysisRunning = stats.inProgress > 0;

  // *For Live Status — poll while the worker still has CVs of this job to analyze
  useEffect(() => {
    if (!analysisRunning) return;
    let cancelled = false;

    const timer = setTimeout(() => {
      getJobCandidates(job.id)
        .then(({ data }) => {
          if (!cancelled) setCandidates(data.candidates);
        })
        .catch(() => {
          // Temporary network problem: keep the current list and try again in STATUS_POLL_MS
          // (a new array re-runs this effect). A 401 is handled by clientApi (back to login).
          if (!cancelled) setCandidates((prev) => [...prev]);
        });
    }, STATUS_POLL_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [analysisRunning, candidates, job.id]);

  // *For Upload CVs (POST /jobs/:id/cvs)
  const handleUpload = async (files: { file: File; type: CvFileType }[]) => {
    try {
      const { message, data } = await uploadCvs(job.id, files.map(({ file }) => file));

      // New CVs come back as "queued"; the polling above follows them until they are analyzed
      setCandidates((prev) => [...prev, ...data.candidates]);
      if (data.rejected.length > 0) {
        ErrorToaster(`${message} ${data.rejected.length} file(s) were rejected — see the list for the reason.`);
      } else {
        SuccessToaster(message);
      }
      return data.rejected;
    } catch (error: unknown) {
      ErrorToaster(error instanceof Error ? error.message : "Something went wrong");
      return null;
    }
  };

  // *For Retry Failed CV (POST /candidates/:id/retry)
  const handleRetry = async (candidate: Candidate) => {
    setRetryingId(candidate.id);
    try {
      const { message, data } = await retryCandidate(candidate.id);
      // Back to "queued": the polling above follows it again until analyzed
      setCandidates((prev) => prev.map((c) => (c.id === candidate.id ? data : c)));
      SuccessToaster(message);
    } catch (error: unknown) {
      ErrorToaster(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setRetryingId(null);
    }
  };

  // *For Delete CV (DELETE /candidates/:id)
  const confirmDelete = async () => {
    if (!candidateToDelete) return;
    setDeleting(true);
    try {
      const { message } = await deleteCandidate(candidateToDelete.id);
      setCandidates((prev) => prev.filter((c) => c.id !== candidateToDelete.id));
      SuccessToaster(message);
      setCandidateToDelete(null);
    } catch (error: unknown) {
      ErrorToaster(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={job.title}
        description={job.description || `Created ${formatDate(job.createdAt)}`}
        actions={
          <>
            <Link href={`/jobs/${job.id}/edit`} className="btn btn-light border d-inline-flex align-items-center justify-content-center gap-2">
              <i className="bi bi-sliders" aria-hidden="true" />
              Edit Criteria
            </Link>
            <a href="#upload" className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2">
              <i className="bi bi-cloud-arrow-up" aria-hidden="true" />
              Upload CVs
            </a>
          </>
        }
      />

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <StatCard label="Total CVs" value={stats.total} icon="bi-files" />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard label="Analyzed" value={stats.analyzed} icon="bi-check2-circle" tone="success" />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard label="In Progress" value={stats.inProgress} icon="bi-arrow-repeat" tone="info" hint="Queued or processing" />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard label="Failed" value={stats.failed} icon="bi-exclamation-triangle" tone="danger" />
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-5 col-xxl-4">
          <CriteriaSummary job={job} />
        </div>
        <div id="upload" className="col-12 col-xl-7 col-xxl-8 hf-anchor">
          <CvUploader existingFileNames={candidates.map((c) => c.fileName)} onUpload={handleUpload} />
        </div>
      </div>

      <div id="ranking" className="hf-anchor">
        <CandidateRanking
          job={job}
          candidates={candidates}
          onRetry={handleRetry}
          onDelete={setCandidateToDelete}
          busyId={retryingId}
        />
      </div>

      <ConfirmDialog
        show={candidateToDelete !== null}
        title="Delete this CV?"
        message={
          <>
            <span className="fw-semibold text-body-emphasis">
              {candidateToDelete?.profile?.name ?? candidateToDelete?.fileName}
            </span>{" "}
            and its AI evaluation will be permanently removed from this job.
          </>
        }
        confirmLabel={deleting ? "Deleting…" : "Delete CV"}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setCandidateToDelete(null)}
      />
    </>
  );
}
