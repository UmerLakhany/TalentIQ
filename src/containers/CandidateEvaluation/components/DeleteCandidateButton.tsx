"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorToaster, SuccessToaster } from "@/components/Toaster";
import ConfirmDialog from "@/core/modals/ConfirmDialog";
import { deleteCandidate } from "@/services/candidateService";

interface DeleteCandidateButtonProps {
  candidateId: string;
  candidateName: string;
  jobId: string;
}

/** "Delete CV" on the candidate page: confirms, calls DELETE /candidates/:id, then returns to the job ranking. */
export default function DeleteCandidateButton({ candidateId, candidateName, jobId }: DeleteCandidateButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // *For Delete Candidate (DELETE /candidates/:id)
  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const { message } = await deleteCandidate(candidateId);
      SuccessToaster(message);
      router.replace(`/jobs/${jobId}#ranking`);
      router.refresh();
    } catch (error: unknown) {
      ErrorToaster(error instanceof Error ? error.message : "Something went wrong");
      setDeleting(false);
    }
  };

  return (
    <>
      <button type="button" className="btn btn-outline-danger" onClick={() => setConfirming(true)}>
        <i className="bi bi-trash3 me-1" aria-hidden="true" />
        Delete CV
      </button>

      <ConfirmDialog
        show={confirming}
        title="Delete this candidate?"
        message={
          <>
            <span className="fw-semibold text-body-emphasis">{candidateName}</span>&apos;s CV and AI evaluation will be
            permanently removed from this job.
          </>
        }
        confirmLabel={deleting ? "Deleting…" : "Delete CV"}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
