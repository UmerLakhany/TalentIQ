import { VERDICT_LABELS, type Verdict } from "@/data/candidates";

const VERDICT_STYLE: Record<Verdict, { tone: string; icon: string }> = {
  met: { tone: "success", icon: "bi-check-circle-fill" },
  partial: { tone: "warning", icon: "bi-dash-circle-fill" },
  not_met: { tone: "danger", icon: "bi-x-circle-fill" },
  // Missing information is not proof the skill is absent — shown neutrally
  not_found: { tone: "secondary", icon: "bi-question-circle-fill" },
};

export default function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const { tone, icon } = VERDICT_STYLE[verdict];
  return (
    <span
      className={`badge rounded-pill fw-medium d-inline-flex align-items-center gap-1 text-nowrap bg-${tone}-subtle text-${tone}-emphasis border border-${tone}-subtle`}
    >
      <i className={`bi ${icon}`} aria-hidden="true" />
      {VERDICT_LABELS[verdict]}
    </span>
  );
}
