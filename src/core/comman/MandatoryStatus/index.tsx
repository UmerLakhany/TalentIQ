interface MandatoryStatusProps {
  passed: number | null;
  total: number | null;
}

/**
 * Mandatory criteria are shown next to the score so a high weighted score
 * never hides a failed mandatory requirement.
 */
export default function MandatoryStatus({ passed, total }: MandatoryStatusProps) {
  if (passed === null || total === null) return null;

  const missing = total - passed;
  return missing === 0 ? (
    <span className="small text-success-emphasis text-nowrap">
      <i className="bi bi-check-circle-fill me-1" aria-hidden="true" />
      All {total} mandatory met
    </span>
  ) : (
    <span className="small text-danger-emphasis text-nowrap">
      <i className="bi bi-x-octagon-fill me-1" aria-hidden="true" />
      {missing} of {total} mandatory not met
    </span>
  );
}
