interface StatCardProps {
  label: string;
  value: string | number;
  /** Bootstrap Icons class, e.g. "bi-people" */
  icon: string;
  /** Bootstrap colour name */
  tone?: string;
  hint?: string;
}

export default function StatCard({ label, value, icon, tone = "primary", hint }: StatCardProps) {
  return (
    <div className="card h-100 shadow-sm">
      <div className="card-body d-flex align-items-center gap-3 p-3 p-lg-4">
        <span
          className={`hf-stat-icon rounded-3 d-inline-flex align-items-center justify-content-center bg-${tone}-subtle text-${tone}`}
        >
          <i className={`bi ${icon}`} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="small text-secondary text-truncate">{label}</div>
          <div className="fs-4 fw-semibold text-body-emphasis lh-sm">{value}</div>
          {hint && <div className="small text-secondary text-truncate">{hint}</div>}
        </div>
      </div>
    </div>
  );
}
