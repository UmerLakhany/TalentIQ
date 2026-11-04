import type { JobSummary } from "@/utils/jobs";

/** "6 / 10 analyzed" + bar + in-progress / failed notes for one job. */
export default function AnalysisProgress({ summary }: { summary: JobSummary }) {
  if (summary.totalCvs === 0) return <span className="small text-secondary">No CVs yet</span>;

  const percent = Math.round((summary.analyzed / summary.totalCvs) * 100);
  return (
    <div className="hf-score">
      <div className="small text-body-emphasis fw-semibold">
        {summary.analyzed} / {summary.totalCvs} analyzed
      </div>
      <div
        className="progress hf-score-bar my-1"
        role="progressbar"
        aria-label="Analysis progress"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress-bar bg-success" style={{ width: `${percent}%` }} />
      </div>
      <div className="small text-secondary d-flex flex-wrap column-gap-2">
        {summary.inProgress > 0 && <span className="text-primary">{summary.inProgress} in progress</span>}
        {summary.failed > 0 && <span className="text-danger">{summary.failed} failed</span>}
      </div>
    </div>
  );
}
