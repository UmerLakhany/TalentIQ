import { REQUIREMENT_TYPE_LABELS, type RequirementType } from "@/data/jobs";

const TYPE_TONE: Record<RequirementType, string> = {
  mandatory: "danger",
  preferred: "info",
  not_required: "secondary",
};

export default function RequirementTypeBadge({ type }: { type: RequirementType }) {
  const tone = TYPE_TONE[type];
  return (
    <span className={`badge rounded-pill fw-medium text-nowrap bg-${tone}-subtle text-${tone}-emphasis`}>
      {REQUIREMENT_TYPE_LABELS[type]}
    </span>
  );
}
