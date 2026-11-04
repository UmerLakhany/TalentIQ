import type { Metadata } from "next";
import { Suspense } from "react";
import CandidatesPage from "@/containers/Candidates";

export const metadata: Metadata = { title: "Candidates | HireFlow AI" };

export default function Candidates() {
  return (
    // Needed because the page reads the URL search params
    <Suspense
      fallback={
        <div className="d-flex align-items-center justify-content-center gap-2 text-secondary py-5">
          <span className="spinner-border spinner-border-sm text-primary" aria-hidden="true" />
          Loading candidates…
        </div>
      }
    >
      <CandidatesPage />
    </Suspense>
  );
}
