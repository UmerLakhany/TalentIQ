import RequirementTypeBadge from "@/core/comman/RequirementTypeBadge";
import VerdictBadge from "@/core/comman/VerdictBadge";
import type { RequirementEvaluation } from "@/data/candidates";
import { REQUIREMENT_CATEGORY_LABELS, type Job, type JobRequirement } from "@/data/jobs";

interface RequirementTableProps {
  job: Job;
  evaluations: RequirementEvaluation[];
}

function Evidence({ text }: { text: string | null }) {
  return text ? (
    <span className="fst-italic text-body">{text}</span>
  ) : (
    <span className="text-secondary">No evidence found in the CV</span>
  );
}

/** One row per job requirement: type, AI verdict, CV evidence and explanation. */
export default function RequirementTable({ job, evaluations }: RequirementTableProps) {
  const rows = evaluations
    .map((evaluation) => ({ evaluation, requirement: job.requirements.find((r) => r.id === evaluation.requirementId) }))
    .filter((row): row is { evaluation: RequirementEvaluation; requirement: JobRequirement } => Boolean(row.requirement))
    // Mandatory first
    .sort((a, b) => Number(b.requirement.type === "mandatory") - Number(a.requirement.type === "mandatory"));

  const ignored = job.requirements.filter((r) => r.type === "not_required");

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-white px-3 px-lg-4 py-3">
        <h2 className="h6 fw-semibold text-body-emphasis mb-0">Requirement-by-requirement evaluation</h2>
        <p className="small text-secondary mb-0">How the AI judged each job requirement, with the evidence it found in the CV.</p>
      </div>

      {/* Laptop and up: table */}
      <div className="table-responsive d-none d-lg-block">
        <table className="table align-middle mb-0 hf-table">
          <thead>
            <tr>
              <th scope="col">Requirement</th>
              <th scope="col">Type</th>
              <th scope="col">Verdict</th>
              <th scope="col">Evidence from CV</th>
              <th scope="col">AI explanation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ requirement, evaluation }) => (
              <tr key={requirement.id}>
                <td className="hf-cell-req">
                  <div className="fw-medium text-body-emphasis">{requirement.name}</div>
                  <div className="small text-secondary">{REQUIREMENT_CATEGORY_LABELS[requirement.category]}</div>
                </td>
                <td>
                  <RequirementTypeBadge type={requirement.type} />
                </td>
                <td>
                  <VerdictBadge verdict={evaluation.verdict} />
                </td>
                <td className="small hf-cell-text">
                  <Evidence text={evaluation.evidence} />
                </td>
                <td className="small hf-cell-text">{evaluation.explanation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones & tablets: stacked */}
      <ul className="list-group list-group-flush d-lg-none">
        {rows.map(({ requirement, evaluation }) => (
          <li key={requirement.id} className="list-group-item px-3 py-3">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
              <span className="fw-medium text-body-emphasis me-auto">{requirement.name}</span>
              <RequirementTypeBadge type={requirement.type} />
            </div>
            <div className="mb-2">
              <VerdictBadge verdict={evaluation.verdict} />
            </div>
            <div className="small mb-1">
              <span className="text-secondary">Evidence: </span>
              <Evidence text={evaluation.evidence} />
            </div>
            <div className="small text-body">{evaluation.explanation}</div>
          </li>
        ))}
      </ul>

      {ignored.length > 0 && (
        <div className="card-footer bg-white small text-secondary px-3 px-lg-4">
          <i className="bi bi-slash-circle me-1" aria-hidden="true" />
          Not evaluated (marked Not required): {ignored.map((r) => r.name).join(", ")}
        </div>
      )}
    </div>
  );
}
