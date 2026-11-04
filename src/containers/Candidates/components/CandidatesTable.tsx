import Link from "next/link";
import ApplicationStatusBadge from "@/core/comman/ApplicationStatusBadge";
import Avatar from "@/core/comman/Avatar";
import MandatoryStatus from "@/core/comman/MandatoryStatus";
import MatchScore from "@/core/comman/MatchScore";
import type { ApplicationStatus, Candidate } from "@/data/candidates";
import { formatDate } from "@/utils/format";
import CandidateActions from "./CandidateActions";

export type SortKey = "name" | "experience" | "matchScore" | "addedAt";
export interface SortState {
  key: SortKey;
  direction: "asc" | "desc";
}

interface CandidatesTableProps {
  candidates: Candidate[];
  sort: SortState;
  onSort: (key: SortKey) => void;
  onStatusChange: (candidate: Candidate, status: ApplicationStatus) => void;
  onReject: (candidate: Candidate) => void;
  onDownloadCv: (candidate: Candidate) => void;
}

const MAX_SKILLS = 3;

export function SkillBadges({ skills, max = MAX_SKILLS }: { skills: string[]; max?: number }) {
  if (skills.length === 0) return <span className="small text-secondary">—</span>;
  return (
    <div className="d-flex flex-wrap gap-1">
      {skills.slice(0, max).map((skill) => (
        <span key={skill} className="badge bg-body-secondary text-body fw-normal border">
          {skill}
        </span>
      ))}
      {skills.length > max && (
        <span className="badge bg-primary-subtle text-primary fw-normal" title={skills.slice(max).join(", ")}>
          +{skills.length - max}
        </span>
      )}
    </div>
  );
}

export default function CandidatesTable({
  candidates,
  sort,
  onSort,
  onStatusChange,
  onReject,
  onDownloadCv,
}: CandidatesTableProps) {
  const sortHeader = (key: SortKey, label: string, className = "") => {
    const active = sort.key === key;
    const icon = !active ? "bi-arrow-down-up opacity-50" : sort.direction === "asc" ? "bi-arrow-up" : "bi-arrow-down";
    return (
      <th
        scope="col"
        className={className}
        aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
      >
        <button
          type="button"
          className={`btn btn-link p-0 border-0 text-decoration-none hf-sort-btn ${active ? "text-primary" : ""}`}
          onClick={() => onSort(key)}
        >
          {label}
          <i className={`bi ${icon} ms-1`} aria-hidden="true" />
        </button>
      </th>
    );
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0 hf-table">
        <thead>
          <tr>
            {sortHeader("name", "Candidate")}
            <th scope="col">Applied Position</th>
            {sortHeader("experience", "Experience", "d-none d-lg-table-cell")}
            <th scope="col" className="d-none d-xl-table-cell">Skills</th>
            {sortHeader("matchScore", "Match Score")}
            <th scope="col">Application Status</th>
            {sortHeader("addedAt", "Date Added", "d-none d-xxl-table-cell")}
            <th scope="col" className="text-end">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id}>
              <td>
                <div className="d-flex align-items-center gap-3">
                  <Avatar name={candidate.name} />
                  <div className="min-w-0">
                    <Link
                      href={`/candidates/${candidate.id}`}
                      className="fw-semibold text-body-emphasis text-decoration-none text-nowrap"
                    >
                      {candidate.name}
                    </Link>
                    <div className="small text-secondary text-nowrap">{candidate.email}</div>
                    {/* Experience moves here when its column is hidden */}
                    <div className="small text-secondary text-nowrap d-lg-none">
                      {candidate.experienceYears !== null ? `${candidate.experienceYears} yrs experience` : "Experience pending"}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <Link href={`/jobs/${candidate.jobId}`} className="link-body-emphasis text-decoration-none text-nowrap">
                  {candidate.jobTitle}
                </Link>
                <div className="small text-secondary text-nowrap">
                  <i className="bi bi-geo-alt me-1" aria-hidden="true" />
                  {candidate.location}
                </div>
              </td>
              <td className="text-nowrap d-none d-lg-table-cell">
                {candidate.experienceYears !== null ? (
                  `${candidate.experienceYears} yrs`
                ) : (
                  <span className="text-secondary">—</span>
                )}
              </td>
              <td className="d-none d-xl-table-cell">
                <SkillBadges skills={candidate.skills} />
              </td>
              <td>
                <MatchScore score={candidate.matchScore} analysisStatus={candidate.analysisStatus} />
                <MandatoryStatus passed={candidate.mandatoryPassed} total={candidate.mandatoryTotal} />
              </td>
              <td>
                <ApplicationStatusBadge status={candidate.applicationStatus} />
                <div className="small text-secondary text-nowrap mt-1 d-xxl-none">
                  Added {formatDate(candidate.addedAt)}
                </div>
              </td>
              <td className="text-nowrap text-secondary d-none d-xxl-table-cell">{formatDate(candidate.addedAt)}</td>
              <td className="text-end">
                <CandidateActions
                  candidate={candidate}
                  onStatusChange={onStatusChange}
                  onReject={onReject}
                  onDownloadCv={onDownloadCv}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
