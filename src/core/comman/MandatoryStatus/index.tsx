interface MandatoryStatusProps {
  met: number;
  total: number;
}

/**
 * Shown next to the score so a high weighted score never hides
 * a mandatory requirement that is not (fully) met.
 */
export default function MandatoryStatus({ met, total }: MandatoryStatusProps) {
  if (total === 0) return null;

  const missing = total - met;
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
