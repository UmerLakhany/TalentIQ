import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card shadow-sm">
      <div className="card-body text-center py-5 px-3">
        <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary fs-4 mb-3 hf-empty-icon">
          <i className="bi bi-search" aria-hidden="true" />
        </span>
        <h2 className="h5 fw-semibold text-body-emphasis">Page not found</h2>
        <p className="text-secondary mb-4">
          This job or candidate doesn&apos;t exist, or the CV hasn&apos;t finished analysis yet.
        </p>
        <Link href="/jobs" className="btn btn-primary">
          <i className="bi bi-arrow-left me-1" aria-hidden="true" />
          Back to Jobs
        </Link>
      </div>
    </div>
  );
}
