import type { JobStatus } from "@/data/jobs";

const STATUS_TONE: Record<JobStatus, string> = {
  Active: "success",
  Draft: "secondary",
  Paused: "warning",
  Closed: "danger",
};

export default function JobStatusBadge({ status }: { status: JobStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className={`badge rounded-pill fw-medium d-inline-flex align-items-center gap-1 bg-${tone}-subtle text-${tone}-emphasis border border-${tone}-subtle`}
    >
      <i className="bi bi-circle-fill hf-status-dot" aria-hidden="true" />
      {status}
    </span>
  );
}
