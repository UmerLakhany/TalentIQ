import { getScoreBand } from "@/data/candidates";

interface MatchScoreProps {
  /** null when the CV has not been analyzed yet */
  score: number | null;
}

/** Score + coloured bar + band label (Strong / Good / Partial / Low). */
export default function MatchScore({ score }: MatchScoreProps) {
  if (score === null) return <span className="text-secondary">—</span>;

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
