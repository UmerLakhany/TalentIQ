import Link from "next/link";
import type { ReactNode } from "react";
import AnalysisProgress from "@/core/comman/AnalysisProgress";
import Avatar from "@/core/comman/Avatar";
import MandatoryStatus from "@/core/comman/MandatoryStatus";
import MatchScore from "@/core/comman/MatchScore";
import PageHeader from "@/core/comman/PageHeader";
import ProcessingStatusBadge from "@/core/comman/ProcessingStatusBadge";
import StatCard from "@/core/comman/StatCard";
import { MATCH_SCORE_BANDS, PROCESSING_STATUS_LABELS, getScoreBand, type ProcessingStatus } from "@/data/candidates";
import type { DashboardData } from "@/services/server/dashboardService";
import { formatDateTime } from "@/utils/format";
import AutoRefresh from "./components/AutoRefresh";

interface DashboardProps {
  /** From GET /dashboard (loaded on the server by app/dashboard/page.tsx) */
  data: DashboardData;
}

const STATUS_TONE: Record<ProcessingStatus, string> = {
  completed: "success",
  processing: "primary",
  queued: "secondary",
  failed: "danger",
};

/** Colour of a score band, by its label (bands come from the API, colours from the panel's MATCH_SCORE_BANDS). */
const bandTone = (label: string) => MATCH_SCORE_BANDS.find((band) => band.label === label)?.tone ?? "secondary";

/** Label + count + thin bar, used by the two breakdown cards */
function BreakdownRow({ label, count, total, tone }: { label: string; count: number; total: number; tone: string }) {
  const percent = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <li className="mb-3">
      <div className="d-flex justify-content-between small mb-1">
        <span className="text-body">{label}</span>
        <span className="text-secondary">
          <span className="fw-semibold text-body-emphasis">{count}</span> · {percent}%
        </span>
      </div>
      <div className="progress hf-score-bar" role="progressbar" aria-label={`${label}: ${count}`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className={`progress-bar bg-${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </li>
  );
}

function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="card-header bg-white d-flex align-items-center justify-content-between gap-2 px-3 px-lg-4 py-3">
      <div className="min-w-0">
        <h2 className="h6 fw-semibold text-body-emphasis mb-0">{title}</h2>
        {subtitle && <p className="small text-secondary mb-0">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export default function Dashboard({ data }: DashboardProps) {
  const { stats, topCandidates, scoreDistribution, processing, jobs, needsAttention } = data;
  const scoredTotal = scoreDistribution.reduce((sum, band) => sum + band.count, 0);

  return (
    <>
      {/* While CVs are being analyzed, reload the numbers every 10 seconds */}
      <AutoRefresh active={stats.inProgress > 0} />

      <PageHeader
        title="Dashboard"
        description="Overview of your jobs, CV processing and the best-matching candidates."
        actions={
          <>
            <Link href="/jobs" className="btn btn-light border d-inline-flex align-items-center justify-content-center gap-2">
              <i className="bi bi-briefcase" aria-hidden="true" />
              View Jobs
            </Link>
            <Link href="/jobs/create" className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2">
              <i className="bi bi-plus-lg" aria-hidden="true" />
              Create Job
            </Link>
          </>
        }
      />

      {/* Key numbers */}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xxl-6 g-3 mb-4">
        <div className="col">
          <StatCard label="Jobs" value={stats.jobs} icon="bi-briefcase" />
        </div>
        <div className="col">
          <StatCard label="CVs Uploaded" value={stats.cvs} icon="bi-files" tone="secondary" />
        </div>
        <div className="col">
          <StatCard
            label="Analyzed"
            value={stats.analyzed}
            icon="bi-check2-circle"
            tone="success"
            hint={stats.averageScore !== null ? `Avg. score ${stats.averageScore}%` : "No scores yet"}
          />
        </div>
        <div className="col">
          <StatCard label="In Progress" value={stats.inProgress} icon="bi-arrow-repeat" tone="info" hint="Queued or processing" />
        </div>
        <div className="col">
          <StatCard label="Failed" value={stats.failed} icon="bi-exclamation-triangle" tone="danger" hint="Retry from the job page" />
        </div>
        <div className="col">
          <StatCard
            label="All Mandatory Met"
            value={stats.allMandatoryMet}
            icon="bi-patch-check"
            tone="warning"
            hint={`of ${stats.analyzed} analyzed`}
          />
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Top candidates */}
        <div className="col-12 col-xl-8">
          <div className="card shadow-sm h-100">
            <CardHeader title="Top matching candidates" subtitle="Highest AI match scores across all jobs" />
            {topCandidates.length === 0 ? (
              <div className="card-body text-center text-secondary py-5">No CVs have been analyzed yet.</div>
            ) : (
              <>
                {/* Tablet and up */}
                <div className="table-responsive d-none d-md-block">
                  <table className="table table-hover align-middle mb-0 hf-table">
                    <thead>
                      <tr>
                        <th scope="col">Candidate</th>
                        <th scope="col" className="d-none d-lg-table-cell">Job</th>
                        <th scope="col">Match Score</th>
                        <th scope="col">Mandatory</th>
                        <th scope="col" className="text-end">
                          <span className="visually-hidden">Action</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCandidates.map((candidate) => (
                        <tr key={candidate.id}>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <Avatar name={candidate.name} />
                              <div className="min-w-0">
                                <Link href={`/candidates/${candidate.id}`} className="fw-semibold text-body-emphasis text-decoration-none text-nowrap">
                                  {candidate.name}
                                </Link>
                                <div className="small text-secondary text-nowrap">
                                  <span className="d-lg-none">{candidate.jobTitle}</span>
                                  <span className="d-none d-lg-inline">{candidate.currentRole}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="d-none d-lg-table-cell">
                            <Link href={`/jobs/${candidate.jobId}`} className="link-body-emphasis text-decoration-none text-nowrap">
                              {candidate.jobTitle}
                            </Link>
                          </td>
                          <td>
                            <MatchScore score={candidate.matchScore} />
                          </td>
                          <td>
                            <MandatoryStatus met={candidate.mandatoryMet} total={candidate.mandatoryTotal} />
                          </td>
                          <td className="text-end">
                            <Link href={`/candidates/${candidate.id}`} className="btn btn-sm btn-outline-primary">
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Phones */}
                <div className="list-group list-group-flush d-md-none">
                  {topCandidates.map((candidate) => (
                    <Link key={candidate.id} href={`/candidates/${candidate.id}`} className="list-group-item list-group-item-action py-3">
                      <div className="d-flex align-items-start gap-3">
                        <Avatar name={candidate.name} />
                        <div className="flex-grow-1 min-w-0">
                          <div className="fw-semibold text-body-emphasis text-truncate">{candidate.name}</div>
                          <div className="small text-secondary text-truncate mb-2">{candidate.jobTitle}</div>
                          <MatchScore score={candidate.matchScore} />
                          <MandatoryStatus met={candidate.mandatoryMet} total={candidate.mandatoryTotal} />
                        </div>
                        <i className="bi bi-chevron-right text-secondary align-self-center" aria-hidden="true" />
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Breakdowns */}
        <div className="col-12 col-xl-4">
          <div className="row g-4">
            <div className="col-12 col-md-6 col-xl-12">
              <div className="card shadow-sm h-100">
                <CardHeader title="Match score distribution" subtitle={`${scoredTotal} analyzed candidates`} />
                <div className="card-body px-3 px-lg-4">
                  <ul className="list-unstyled mb-0">
                    {scoreDistribution.map((band, index) => (
                      <BreakdownRow
                        key={band.label}
                        label={`${band.label} (${index === 0 ? `${band.min}+` : `${band.min}–${band.max}`})`}
                        count={band.count}
                        total={scoredTotal}
                        tone={bandTone(band.label)}
                      />
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-12">
              <div className="card shadow-sm h-100">
                <CardHeader title="CV processing" subtitle={`${stats.cvs} CVs uploaded`} />
                <div className="card-body px-3 px-lg-4">
                  <ul className="list-unstyled mb-0">
                    {(["completed", "processing", "queued", "failed"] as ProcessingStatus[]).map((status) => (
                      <BreakdownRow
                        key={status}
                        label={PROCESSING_STATUS_LABELS[status]}
                        count={processing[status]}
                        total={stats.cvs}
                        tone={STATUS_TONE[status]}
                      />
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Jobs overview */}
        <div className="col-12 col-xl-8">
          <div className="card shadow-sm h-100">
            <CardHeader
              title="Jobs overview"
              subtitle="Processing progress and best candidate per job"
              action={
                <Link href="/jobs" className="btn btn-sm btn-link text-decoration-none text-nowrap">
                  View all
                </Link>
              }
            />
            {jobs.length === 0 ? (
              <div className="card-body text-center text-secondary py-5">
                No jobs yet.{" "}
                <Link href="/jobs/create" className="fw-medium text-decoration-none">
                  Create your first job
                </Link>
              </div>
            ) : (
              <ul className="list-group list-group-flush">
                {jobs.map((job) => (
                  <li key={job.id} className="list-group-item px-3 px-lg-4 py-3">
                    <div className="row g-3 align-items-center">
                      <div className="col-12 col-md-4">
                        <Link href={`/jobs/${job.id}`} className="fw-semibold text-body-emphasis text-decoration-none">
                          {job.title}
                        </Link>
                        <div className="small text-secondary">
                          {job.mandatory} mandatory · {job.preferred} preferred
                        </div>
                      </div>
                      <div className="col-6 col-md-4">
                        <AnalysisProgress summary={job} />
                      </div>
                      <div className="col-6 col-md-4">
                        {job.bestCandidate ? (
                          <Link href={`/candidates/${job.bestCandidate.id}`} className="d-block text-decoration-none">
                            <span className="small text-secondary d-block">Best match</span>
                            <span className="fw-medium text-body-emphasis d-block text-truncate">{job.bestCandidate.name}</span>
                            <span className={`small fw-semibold text-${getScoreBand(job.bestCandidate.matchScore).tone}-emphasis`}>
                              {job.bestCandidate.matchScore}%
                            </span>
                          </Link>
                        ) : (
                          <span className="small text-secondary">No analyzed CVs yet</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Failed CVs */}
        <div className="col-12 col-xl-4">
          <div className="card shadow-sm h-100">
            <CardHeader title="Needs attention" subtitle="CVs that could not be processed" />
            {needsAttention.length === 0 ? (
              <div className="card-body text-center text-secondary py-4">
                <i className="bi bi-check-circle text-success fs-4 d-block mb-2" aria-hidden="true" />
                All CVs processed successfully.
              </div>
            ) : (
              <ul className="list-group list-group-flush">
                {needsAttention.map((cv) => (
                  <li key={cv.id} className="list-group-item px-3 px-lg-4 py-3">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                      <span className="fw-medium text-body-emphasis text-truncate">{cv.fileName}</span>
                      <ProcessingStatusBadge status="failed" />
                    </div>
                    {cv.errorMessage && <div className="small text-danger mb-1">{cv.errorMessage}</div>}
                    <div className="small text-secondary">
                      <Link href={`/jobs/${cv.jobId}#ranking`} className="link-secondary">
                        {cv.jobTitle}
                      </Link>{" "}
                      · {formatDateTime(cv.uploadedAt)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
