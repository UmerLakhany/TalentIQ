"use client";

import Link from "next/link";
import { useState } from "react";
import Avatar from "@/core/comman/Avatar";
import MandatoryStatus from "@/core/comman/MandatoryStatus";
import MatchScore from "@/core/comman/MatchScore";
import ProcessingStatusBadge from "@/core/comman/ProcessingStatusBadge";
import type { Candidate, ProcessingStatus } from "@/data/candidates";
import type { Job } from "@/data/jobs";
import { formatDateTime, formatYears } from "@/utils/format";
import { calculateScore, type ScoreBreakdown } from "@/utils/scoring";

type SortKey = "score" | "experience" | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "score", label: "Highest match score" },
  { value: "experience", label: "Most experience" },
  { value: "name", label: "Name (A–Z)" },
];

// Not-yet-analyzed CVs are listed after the ranked ones, in this order
const PENDING_ORDER: ProcessingStatus[] = ["processing", "queued", "failed"];

interface Row {
  candidate: Candidate;
  breakdown: ScoreBreakdown | null;
  rank: number | null;
}

interface CandidateRankingProps {
  job: Job;
  candidates: Candidate[];
  /** Re-queue a failed CV (POST /candidates/:id/retry) */
  onRetry: (candidate: Candidate) => void;
  /** Ask to delete a CV (DELETE /candidates/:id after confirmation) */
  onDelete: (candidate: Candidate) => void;
  /** Candidate whose retry request is in flight (its buttons are disabled) */
  busyId?: string | null;
}

export default function CandidateRanking({ job, candidates, onRetry, onDelete, busyId = null }: CandidateRankingProps) {
  /** Retry (failed CVs only) + delete buttons. */
  const rowActions = (candidate: Candidate) => {
    const name = candidate.profile?.name ?? candidate.fileName;
    const busy = busyId === candidate.id;
    return (
      <>
        {candidate.status === "failed" && (
          <button
            type="button"
            className="btn btn-sm btn-outline-primary text-nowrap"
            onClick={() => onRetry(candidate)}
            disabled={busy}
            title="Analyze this CV again"
          >
            {busy ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <i className="bi bi-arrow-clockwise" aria-hidden="true" />
            )}
            <span className="ms-1">Retry</span>
          </button>
        )}
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={() => onDelete(candidate)}
          disabled={busy}
          aria-label={`Delete ${name}`}
          title="Delete CV"
        >
          <i className="bi bi-trash3" aria-hidden="true" />
        </button>
      </>
    );
  };

  const [sortKey, setSortKey] = useState<SortKey>("score");

  const analyzed = candidates
    .filter((c) => c.status === "completed" && c.profile && c.evaluation)
    .map((candidate) => ({ candidate, breakdown: calculateScore(job, candidate) }));

  // Rank is always by match score, whatever the display sort is
  const rankById = new Map(
    [...analyzed]
      .sort((a, b) => (b.breakdown?.score ?? 0) - (a.breakdown?.score ?? 0))
      .map((row, index) => [row.candidate.id, index + 1])
  );

  const sorted = [...analyzed].sort((a, b) => {
    if (sortKey === "name") return (a.candidate.profile?.name ?? "").localeCompare(b.candidate.profile?.name ?? "");
    if (sortKey === "experience")
      return (b.candidate.profile?.totalExperienceYears ?? 0) - (a.candidate.profile?.totalExperienceYears ?? 0);
    return (b.breakdown?.score ?? 0) - (a.breakdown?.score ?? 0);
  });

  const pending = candidates
    .filter((c) => c.status !== "completed")
    .sort((a, b) => PENDING_ORDER.indexOf(a.status) - PENDING_ORDER.indexOf(b.status));

  const rows: Row[] = [
    ...sorted.map((row) => ({ ...row, rank: rankById.get(row.candidate.id) ?? null })),
    ...pending.map((candidate) => ({ candidate, breakdown: null, rank: null })),
  ];

  const inProgress = candidates.filter((c) => c.status === "queued" || c.status === "processing").length;

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 px-3 px-lg-4 py-3">
        <div>
          <h2 className="h6 fw-semibold text-body-emphasis mb-0">Candidate Ranking</h2>
          <p className="small text-secondary mb-0">
            {analyzed.length} analyzed · ranked by AI match score
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="ranking-sort" className="small text-secondary text-nowrap mb-0">
            Sort by
          </label>
          <select
            id="ranking-sort"
            className="form-select form-select-sm"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {inProgress > 0 && (
        <div className="alert alert-primary d-flex align-items-center gap-2 rounded-0 border-start-0 border-end-0 mb-0 small py-2 px-3 px-lg-4">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          {inProgress} CV{inProgress > 1 ? "s are" : " is"} still being analyzed. Results appear here as each one completes.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card-body text-center py-5">
          <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary fs-4 mb-3 hf-empty-icon">
            <i className="bi bi-people" aria-hidden="true" />
          </span>
          <h3 className="h6 fw-semibold text-body-emphasis">No CVs uploaded yet</h3>
          <p className="text-secondary mb-0">Upload CVs above and the AI will rank candidates here.</p>
        </div>
      ) : (
        <>
          {/* Tablet and up: table */}
          <div className="table-responsive d-none d-md-block">
            <table className="table table-hover align-middle mb-0 hf-table">
              <thead>
                <tr>
                  <th scope="col" className="text-center">Rank</th>
                  <th scope="col">Candidate</th>
                  <th scope="col">Match Score</th>
                  <th scope="col">Mandatory</th>
                  <th scope="col" className="d-none d-lg-table-cell">Experience</th>
                  <th scope="col" className="d-none d-xl-table-cell">Status</th>
                  <th scope="col" className="text-end">
                    <span className="visually-hidden">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ candidate, breakdown, rank }) => {
                  const profile = candidate.profile;
                  return (
                    <tr key={candidate.id}>
                      <td className="text-center">
                        {rank ? (
                          <span className={`badge rounded-pill ${rank <= 3 ? "bg-primary" : "bg-body-secondary text-body"}`}>
                            #{rank}
                          </span>
                        ) : (
                          <span className="text-secondary">—</span>
                        )}
                      </td>
                      <td className="hf-cell-wide">
                        <div className="d-flex align-items-center gap-3">
                          {profile ? (
                            <Avatar name={profile.name} />
                          ) : (
                            <span className="hf-avatar rounded-circle bg-body-secondary text-secondary d-inline-flex align-items-center justify-content-center">
                              <i className="bi bi-file-earmark-text" aria-hidden="true" />
                            </span>
                          )}
                          <div className="min-w-0">
                            {profile ? (
                              <Link href={`/candidates/${candidate.id}`} className="fw-semibold text-body-emphasis text-decoration-none">
                                {profile.name}
                              </Link>
                            ) : (
                              <span className="fw-medium text-body-emphasis">Awaiting extraction</span>
                            )}
                            <div className="small text-secondary text-truncate">{candidate.fileName}</div>
                            {candidate.errorMessage && <div className="small text-danger">{candidate.errorMessage}</div>}
                            {/* Status shows here when its column is hidden */}
                            <div className="d-xl-none mt-1">
                              {candidate.status !== "completed" && <ProcessingStatusBadge status={candidate.status} />}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <MatchScore score={breakdown?.score ?? null} />
                      </td>
                      <td>
                        {breakdown ? (
                          <MandatoryStatus met={breakdown.mandatoryMet} total={breakdown.mandatoryTotal} />
                        ) : (
                          <span className="text-secondary">—</span>
                        )}
                      </td>
                      <td className="d-none d-lg-table-cell text-nowrap">
                        {profile ? formatYears(profile.totalExperienceYears) : <span className="text-secondary">—</span>}
                      </td>
                      <td className="d-none d-xl-table-cell">
                        <ProcessingStatusBadge status={candidate.status} />
                        <div className="small text-secondary mt-1 text-nowrap">{formatDateTime(candidate.uploadedAt)}</div>
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          {candidate.status === "completed" && (
                            <Link href={`/candidates/${candidate.id}`} className="btn btn-sm btn-outline-primary text-nowrap">
                              View
                            </Link>
                          )}
                          {rowActions(candidate)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phones: cards */}
          <ul className="list-group list-group-flush d-md-none">
            {rows.map(({ candidate, breakdown, rank }) => {
              const profile = candidate.profile;
              const content = (
                <div className="d-flex gap-3">
                  <span
                    className={`badge rounded-pill align-self-start mt-1 ${rank && rank <= 3 ? "bg-primary" : "bg-body-secondary text-body"}`}
                  >
                    {rank ? `#${rank}` : "—"}
                  </span>
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex justify-content-between gap-2">
                      <span className="fw-semibold text-body-emphasis text-truncate">
                        {profile?.name ?? "Awaiting extraction"}
                      </span>
                      {profile && <span className="small text-secondary text-nowrap">{formatYears(profile.totalExperienceYears)}</span>}
                    </div>
                    <div className="small text-secondary text-truncate mb-2">{candidate.fileName}</div>
                    {breakdown ? (
                      <>
                        <MatchScore score={breakdown.score} />
                        <MandatoryStatus met={breakdown.mandatoryMet} total={breakdown.mandatoryTotal} />
                      </>
                    ) : (
                      <>
                        <ProcessingStatusBadge status={candidate.status} />
                        {candidate.errorMessage && <div className="small text-danger mt-1">{candidate.errorMessage}</div>}
                        <div className="d-flex gap-2 mt-2">{rowActions(candidate)}</div>
                      </>
                    )}
                  </div>
                  {candidate.status === "completed" && <i className="bi bi-chevron-right text-secondary align-self-center" aria-hidden="true" />}
                </div>
              );
              return candidate.status === "completed" ? (
                <Link key={candidate.id} href={`/candidates/${candidate.id}`} className="list-group-item list-group-item-action py-3">
                  {content}
                </Link>
              ) : (
                <li key={candidate.id} className="list-group-item py-3">
                  {content}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
