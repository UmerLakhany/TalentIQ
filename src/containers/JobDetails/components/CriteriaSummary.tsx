import Link from "next/link";
import RequirementTypeBadge from "@/core/comman/RequirementTypeBadge";
import { REQUIREMENT_CATEGORY_LABELS, type Job, type RequirementCategory, type RequirementType } from "@/data/jobs";

const CATEGORY_ICON: Record<RequirementCategory, string> = {
  experience: "bi-hourglass-split",
  skill: "bi-code-slash",
  education: "bi-mortarboard",
  other: "bi-list-check",
};

const GROUPS: RequirementType[] = ["mandatory", "preferred", "not_required"];

export default function CriteriaSummary({ job }: { job: Job }) {
  return (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-white d-flex align-items-center justify-content-between gap-2 px-3 px-lg-4 py-3">
        <h2 className="h6 fw-semibold text-body-emphasis mb-0">Job Criteria</h2>
        <Link href={`/jobs/${job.id}/edit`} className="btn btn-sm btn-outline-primary">
          <i className="bi bi-sliders me-1" aria-hidden="true" />
          Edit
        </Link>
      </div>
      <div className="card-body px-3 px-lg-4">
        {GROUPS.map((type) => {
          const items = job.requirements.filter((r) => r.type === type);
          if (items.length === 0) return null;
          return (
            <div key={type} className="mb-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <RequirementTypeBadge type={type} />
                <span className="small text-secondary">{items.length}</span>
              </div>
              <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                {items.map((item) => (
                  <li key={item.id} className="d-flex gap-2 small">
                    <i
                      className={`bi ${CATEGORY_ICON[item.category]} text-secondary`}
                      title={REQUIREMENT_CATEGORY_LABELS[item.category]}
                      aria-hidden="true"
                    />
                    <span className={type === "not_required" ? "text-secondary text-decoration-line-through" : "text-body"}>
                      {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
