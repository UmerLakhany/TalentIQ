import Link from "next/link";
import ApplicationStatusBadge from "@/core/comman/ApplicationStatusBadge";
import Avatar from "@/core/comman/Avatar";
import MandatoryStatus from "@/core/comman/MandatoryStatus";
import MatchScore from "@/core/comman/MatchScore";
import type { ApplicationStatus, Candidate } from "@/data/candidates";
import { formatDate } from "@/utils/format";
import CandidateActions from "./CandidateActions";
import { SkillBadges } from "./CandidatesTable";

interface CandidateCardProps {
  candidate: Candidate;
  onStatusChange: (candidate: Candidate, status: ApplicationStatus) => void;
  onReject: (candidate: Candidate) => void;
  onDownloadCv: (candidate: Candidate) => void;
}

/** Phone layout of a candidate row. */
export default function CandidateCard({ candidate, onStatusChange, onReject, onDownloadCv }: CandidateCardProps) {
  return (
    <div className="card h-100 shadow-sm">
      <div className="card-body p-3">
        <div className="d-flex align-items-start gap-3 mb-3">
          <Avatar name={candidate.name} />
          <div className="flex-grow-1 min-w-0">
            <Link
              href={`/candidates/${candidate.id}`}
              className="fw-semibold text-body-emphasis text-decoration-none d-block text-truncate"
            >
              {candidate.name}
            </Link>
            <div className="small text-secondary text-truncate">{candidate.jobTitle}</div>
          </div>
          <CandidateActions
            candidate={candidate}
            onStatusChange={onStatusChange}
            onReject={onReject}
            onDownloadCv={onDownloadCv}
          />
        </div>

        <div className="bg-body border rounded-3 p-2 mb-3">
          <MatchScore score={candidate.matchScore} analysisStatus={candidate.analysisStatus} />
          <MandatoryStatus passed={candidate.mandatoryPassed} total={candidate.mandatoryTotal} />
        </div>

        <div className="d-flex flex-wrap gap-3 small text-secondary mb-2">
          <span>
            <i className="bi bi-briefcase me-1" aria-hidden="true" />
            {candidate.experienceYears !== null ? `${candidate.experienceYears} yrs` : "Pending"}
          </span>
          <span>
            <i className="bi bi-geo-alt me-1" aria-hidden="true" />
            {candidate.location}
          </span>
        </div>

        <div className="mb-3">
          <SkillBadges skills={candidate.skills} max={4} />
        </div>

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <ApplicationStatusBadge status={candidate.applicationStatus} />
          <span className="small text-secondary">Added {formatDate(candidate.addedAt)}</span>
        </div>
      </div>
    </div>
  );
}
