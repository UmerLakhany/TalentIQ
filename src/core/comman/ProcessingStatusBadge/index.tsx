import { PROCESSING_STATUS_LABELS, type ProcessingStatus } from "@/data/candidates";

const STATUS_STYLE: Record<ProcessingStatus, { tone: string; icon: string }> = {
  queued: { tone: "secondary", icon: "bi-hourglass-split" },
  processing: { tone: "primary", icon: "bi-arrow-repeat" },
  completed: { tone: "success", icon: "bi-check-circle" },
  failed: { tone: "danger", icon: "bi-exclamation-triangle" },
};

export default function ProcessingStatusBadge({ status }: { status: ProcessingStatus }) {
  const { tone, icon } = STATUS_STYLE[status];
  return (
    <span
      className={`badge rounded-pill fw-medium d-inline-flex align-items-center gap-1 text-nowrap bg-${tone}-subtle text-${tone}-emphasis border border-${tone}-subtle`}
    >
      {status === "processing" ? (
        <span className="spinner-border hf-spinner-xs" aria-hidden="true" />
      ) : (
        <i className={`bi ${icon}`} aria-hidden="true" />
      )}
      {PROCESSING_STATUS_LABELS[status]}
    </span>
  );
}
