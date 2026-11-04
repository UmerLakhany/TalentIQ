import Link from "next/link";
import type { ApplicationStatus, Candidate } from "@/data/candidates";

interface CandidateActionsProps {
  candidate: Candidate;
  onStatusChange: (candidate: Candidate, status: ApplicationStatus) => void;
  onReject: (candidate: Candidate) => void;
  onDownloadCv: (candidate: Candidate) => void;
}

/** Three-dot action menu used in both the table and the mobile cards. */
export default function CandidateActions({ candidate, onStatusChange, onReject, onDownloadCv }: CandidateActionsProps) {
  const status = candidate.applicationStatus;

  return (
    <div className="dropdown">
      <button
        type="button"
        className="btn hf-icon-btn rounded-3"
        data-bs-toggle="dropdown"
        data-bs-popper-config='{"strategy":"fixed"}'
        aria-expanded="false"
        aria-label={`Actions for ${candidate.name}`}
      >
        <i className="bi bi-three-dots-vertical" />
      </button>
      <ul className="dropdown-menu dropdown-menu-end shadow p-2">
        <li>
          <Link href={`/candidates/${candidate.id}`} className="dropdown-item rounded-2">
            <i className="bi bi-person-vcard me-2 text-secondary" aria-hidden="true" />
            View Profile
          </Link>
        </li>
        <li>
          <button type="button" className="dropdown-item rounded-2" onClick={() => onDownloadCv(candidate)}>
            <i className="bi bi-download me-2 text-secondary" aria-hidden="true" />
            Download CV
          </button>
        </li>
        <li>
          <hr className="dropdown-divider" />
        </li>
        <li>
          <button
            type="button"
            className="dropdown-item rounded-2"
            onClick={() => onStatusChange(candidate, "Shortlisted")}
            disabled={status === "Shortlisted"}
          >
            <i className="bi bi-star me-2 text-success" aria-hidden="true" />
            {status === "Shortlisted" ? "Shortlisted" : "Shortlist"}
          </button>
        </li>
        <li>
          <button
            type="button"
            className="dropdown-item rounded-2"
            onClick={() => onStatusChange(candidate, "Under Review")}
            disabled={status === "Under Review"}
          >
            <i className="bi bi-flag me-2 text-warning" aria-hidden="true" />
            {status === "Under Review" ? "Marked for Review" : "Mark for Review"}
          </button>
        </li>
        <li>
          <button
            type="button"
            className="dropdown-item rounded-2 text-danger"
            onClick={() => onReject(candidate)}
            disabled={status === "Rejected"}
          >
            <i className="bi bi-x-circle me-2" aria-hidden="true" />
            {status === "Rejected" ? "Rejected" : "Reject"}
          </button>
        </li>
      </ul>
    </div>
  );
}
