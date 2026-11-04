import type { ApplicationStatus } from "@/data/candidates";

const STATUS_TONE: Record<ApplicationStatus, string> = {
  New: "info",
  "Under Review": "warning",
  Shortlisted: "success",
  Rejected: "danger",
};

export default function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className={`badge rounded-pill fw-medium d-inline-flex align-items-center gap-1 text-nowrap bg-${tone}-subtle text-${tone}-emphasis border border-${tone}-subtle`}
    >
      <i className="bi bi-circle-fill hf-status-dot" aria-hidden="true" />
      {status}
    </span>
  );
}
