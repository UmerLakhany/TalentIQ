import { getScoreBand, type AnalysisStatus } from "@/data/candidates";

interface MatchScoreProps {
  score: number | null;
  analysisStatus: AnalysisStatus;
}

const PENDING_LABEL: Record<Exclude<AnalysisStatus, "Completed">, { label: string; icon: string; tone: string }> = {
  Processing: { label: "Analyzing…", icon: "bi-arrow-repeat", tone: "primary" },
  Queued: { label: "Queued", icon: "bi-hourglass-split", tone: "secondary" },
  Failed: { label: "Analysis failed", icon: "bi-exclamation-triangle", tone: "danger" },
};

/** Score + band label + bar. Shows the analysis state instead when no score exists yet. */
export default function MatchScore({ score, analysisStatus }: MatchScoreProps) {
  if (score === null || analysisStatus !== "Completed") {
    const pending = PENDING_LABEL[analysisStatus === "Completed" ? "Queued" : analysisStatus];
    return (
      <span className={`small text-${pending.tone} text-nowrap`}>
        <i className={`bi ${pending.icon} me-1`} aria-hidden="true" />
        {pending.label}
      </span>
    );
  }

  const band = getScoreBand(score);
  return (
    <div className="hf-score">
      <div className="d-flex align-items-center gap-2">
        <span className={`fw-semibold text-${band.tone}-emphasis`}>{score}%</span>
        <div
          className="progress flex-grow-1 hf-score-bar"
          role="progressbar"
          aria-label={`Match score ${score}%`}
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={`progress-bar bg-${band.tone}`} style={{ width: `${score}%` }} />
        </div>
      </div>
      <div className="small text-secondary text-nowrap">{band.label}</div>
    </div>
  );
}
