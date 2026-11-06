import Link from "next/link";
import Avatar from "@/core/comman/Avatar";
import MandatoryStatus from "@/core/comman/MandatoryStatus";
import { getScoreBand, type Candidate, type CandidateEvaluation as Evaluation, type CandidateProfile } from "@/data/candidates";
import type { Job } from "@/data/jobs";
import { formatDateTime, formatFileSize, formatYears } from "@/utils/format";
import { calculateScore, type ScoreBreakdown } from "@/utils/scoring";
import { candidateCvUrl } from "@/services/candidateService";
import DeleteCandidateButton from "./components/DeleteCandidateButton";
import RequirementTable from "./components/RequirementTable";

interface CandidateEvaluationProps {
  job: Job;
  candidate: Candidate & { profile: CandidateProfile; evaluation: Evaluation };
}

function ScorePart({ label, points, weight, tone }: { label: string; points: number; weight: number; tone: string }) {
  if (weight === 0) return null;
  const percent = Math.round((points / weight) * 100);
  return (
    <div>
      <div className="d-flex justify-content-between small mb-1">
        <span className="text-secondary">{label}</span>
        <span className="fw-semibold text-body-emphasis">
          {points} / {weight}
        </span>
      </div>
      <div className="progress hf-score-bar" role="progressbar" aria-label={`${label} ${points} of ${weight}`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className={`progress-bar bg-${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function InsightList({ title, icon, tone, items, empty }: { title: string; icon: string; tone: string; items: string[]; empty: string }) {
  return (
    <div className="col-12 col-md-4">
      <div className={`h-100 rounded-3 p-3 bg-${tone}-subtle`}>
        <div className={`fw-semibold small text-${tone}-emphasis mb-2`}>
          <i className={`bi ${icon} me-1`} aria-hidden="true" />
          {title}
        </div>
        {items.length === 0 ? (
          <p className="small text-secondary mb-0">{empty}</p>
        ) : (
          <ul className="small mb-0 ps-3 d-flex flex-column gap-1">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function CandidateEvaluation({ job, candidate }: CandidateEvaluationProps) {
  const { profile, evaluation } = candidate;
  const breakdown = calculateScore(job, candidate) as ScoreBreakdown;
  const band = getScoreBand(breakdown.score);
  const verdictById = new Map(evaluation.requirements.map((r) => [r.requirementId, r.verdict]));
  // Original CV, served by this app (/api/candidates/:id/cv) so preview and download work
  const cvViewUrl = candidateCvUrl(candidate.id);
  const cvDownloadUrl = candidateCvUrl(candidate.id, { download: true });

  return (
    <>
      <Link href={`/jobs/${job.id}#ranking`} className="btn btn-link text-decoration-none px-0 mb-3">
        <i className="bi bi-arrow-left me-1" aria-hidden="true" />
        Back to {job.title} ranking
      </Link>

      {/* Header */}
      <div className="card shadow-sm mb-4">
        <div className="card-body p-3 p-lg-4">
          <div className="row g-4 align-items-center">
            <div className="col-12 col-lg">
              <div className="d-flex align-items-start gap-3">
                <Avatar name={profile.name} size="lg" />
                <div className="min-w-0">
                  <h2 className="h4 fw-semibold text-body-emphasis mb-1">{profile.name}</h2>
                  <div className="text-secondary mb-2">{profile.currentRole}</div>
                  {/* The AI leaves a field empty when the CV doesn't mention it */}
                  <div className="d-flex flex-wrap column-gap-3 row-gap-1 small">
                    {profile.email && (
                      <a href={`mailto:${profile.email}`} className="link-secondary text-decoration-none text-break">
                        <i className="bi bi-envelope me-1" aria-hidden="true" />
                        {profile.email}
                      </a>
                    )}
                    {profile.phone && (
                      <a href={`tel:${profile.phone.replace(/\s/g, "")}`} className="link-secondary text-decoration-none">
                        <i className="bi bi-telephone me-1" aria-hidden="true" />
                        {profile.phone}
                      </a>
                    )}
                    {profile.location && (
                      <span className="text-secondary">
                        <i className="bi bi-geo-alt me-1" aria-hidden="true" />
                        {profile.location}
                      </span>
                    )}
                  </div>
                  <div className="small text-secondary mt-2">
                    Applied for <span className="fw-medium text-body-emphasis">{job.title}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-auto">
              <div className="d-flex flex-column flex-sm-row flex-lg-column align-items-sm-center align-items-lg-stretch gap-3">
                <div className={`rounded-3 border px-4 py-3 text-center bg-${band.tone}-subtle border-${band.tone}-subtle flex-grow-1`}>
                  <div className={`display-6 fw-bold lh-1 text-${band.tone}-emphasis`}>{breakdown.score}%</div>
                  <div className={`small fw-semibold text-${band.tone}-emphasis`}>{band.label}</div>
                  <div className="mt-1">
                    <MandatoryStatus met={breakdown.mandatoryMet} total={breakdown.mandatoryTotal} />
                  </div>
                  {candidate.rank && (
                    <div className="small text-secondary mt-1">
                      Ranked <span className="fw-semibold text-body-emphasis">#{candidate.rank}</span> for this job
                    </div>
                  )}
                </div>
                <div className="d-grid gap-2 flex-grow-1">
                  <a href="#cv" className="btn btn-light border">
                    <i className="bi bi-eye me-1" aria-hidden="true" />
                    View CV
                  </a>
                  <a href={cvDownloadUrl} download={candidate.fileName} className="btn btn-primary">
                    <i className="bi bi-download me-1" aria-hidden="true" />
                    Download CV
                  </a>
                  <DeleteCandidateButton candidateId={candidate.id} candidateName={profile.name} jobId={job.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory requirements not met — never hidden behind the score */}
      {breakdown.unmetMandatory.length > 0 && (
        <div className="alert alert-danger d-flex gap-3 mb-4" role="alert">
          <i className="bi bi-x-octagon-fill fs-5" aria-hidden="true" />
          <div>
            <div className="fw-semibold">Mandatory requirements not fully met</div>
            <ul className="small mb-0 ps-3">
              {breakdown.unmetMandatory.map((req) => {
                const verdict = verdictById.get(req.id);
                return (
                  <li key={req.id}>
                    {req.name}:{" "}
                    {verdict === "not_found" ? "not found in CV (verify)" : verdict === "partial" ? "partially met" : "not met"}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-xl-8">
          {/* Why this score */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white px-3 px-lg-4 py-3">
              <h2 className="h6 fw-semibold text-body-emphasis mb-0">
                <i className="bi bi-stars text-primary me-1" aria-hidden="true" />
                Why this score
              </h2>
            </div>
            <div className="card-body px-3 px-lg-4">
              <p className="mb-4">{evaluation.summary}</p>

              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <ScorePart label="Mandatory requirements" points={breakdown.mandatoryPoints} weight={breakdown.mandatoryWeight} tone="danger" />
                </div>
                <div className="col-12 col-md-6">
                  <ScorePart label="Preferred requirements" points={breakdown.preferredPoints} weight={breakdown.preferredWeight} tone="info" />
                </div>
              </div>

              <div className="row g-3">
                <InsightList title="Strengths" icon="bi-hand-thumbs-up" tone="success" items={evaluation.strengths} empty="None highlighted." />
                <InsightList title="Gaps" icon="bi-exclamation-circle" tone="danger" items={evaluation.gaps} empty="No gaps found." />
                <InsightList title="Verify manually" icon="bi-search" tone="warning" items={evaluation.toVerify} empty="Nothing flagged." />
              </div>

              <p className="small text-secondary mt-3 mb-0">
                <i className="bi bi-info-circle me-1" aria-hidden="true" />
                Generated by AI from the CV content. &ldquo;Not found in CV&rdquo; means the information is missing, not that the
                candidate lacks the skill. Please verify before deciding.
              </p>
            </div>
          </div>

          <RequirementTable job={job} evaluations={evaluation.requirements} />
        </div>

        {/* Extracted information */}
        <div className="col-12 col-xl-4">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white px-3 px-lg-4 py-3">
              <h2 className="h6 fw-semibold text-body-emphasis mb-0">Extracted information</h2>
              <p className="small text-secondary mb-0">What the AI read from the CV</p>
            </div>
            <div className="card-body px-3 px-lg-4">
              <p className="small mb-3">{profile.summary}</p>

              <dl className="row small mb-3">
                <dt className="col-5 text-secondary fw-normal">Total experience</dt>
                <dd className="col-7 fw-medium text-body-emphasis">{formatYears(profile.totalExperienceYears)}</dd>
                <dt className="col-5 text-secondary fw-normal">Current role</dt>
                <dd className="col-7 fw-medium text-body-emphasis">{profile.currentRole}</dd>
                <dt className="col-5 text-secondary fw-normal">Location</dt>
                <dd className="col-7 fw-medium text-body-emphasis mb-0">{profile.location}</dd>
              </dl>

              <h3 className="small fw-semibold text-uppercase text-secondary mb-2">Skills</h3>
              <div className="d-flex flex-wrap gap-1 mb-3">
                {profile.skills.map((skill) => (
                  <span key={skill} className="badge bg-body-secondary text-body fw-normal border">
                    {skill}
                  </span>
                ))}
              </div>

              <h3 className="small fw-semibold text-uppercase text-secondary mb-2">Work history</h3>
              <ul className="list-unstyled small mb-3 d-flex flex-column gap-2">
                {profile.workHistory.map((work) => (
                  <li key={`${work.company}-${work.period}`} className="border-start border-2 border-primary-subtle ps-2">
                    <div className="fw-medium text-body-emphasis">{work.title}</div>
                    <div className="text-secondary">
                      {work.company} · {work.period}
                    </div>
                  </li>
                ))}
              </ul>

              <h3 className="small fw-semibold text-uppercase text-secondary mb-2">Education</h3>
              <ul className="list-unstyled small mb-0">
                {profile.education.map((edu) => (
                  <li key={edu.degree}>
                    <div className="fw-medium text-body-emphasis">{edu.degree}</div>
                    <div className="text-secondary">
                      {edu.institution} · {edu.year}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Original CV */}
      <div id="cv" className="card shadow-sm hf-anchor">
        <div className="card-header bg-white d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 px-3 px-lg-4 py-3">
          <div className="d-flex align-items-center gap-2 min-w-0">
            <i
              className={`bi fs-4 ${candidate.fileType === "PDF" ? "bi-file-earmark-pdf text-danger" : "bi-file-earmark-word text-primary"}`}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h2 className="h6 fw-semibold text-body-emphasis mb-0 text-truncate">{candidate.fileName}</h2>
              <div className="small text-secondary">
                {candidate.fileType} · {formatFileSize(candidate.fileSizeKb)} · uploaded {formatDateTime(candidate.uploadedAt)}
              </div>
            </div>
          </div>
          <div className="d-flex gap-2">
            {candidate.fileType === "PDF" && (
              <a href={cvViewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-light border flex-grow-1">
                <i className="bi bi-box-arrow-up-right me-1" aria-hidden="true" />
                Open
              </a>
            )}
            <a href={cvDownloadUrl} download={candidate.fileName} className="btn btn-sm btn-primary flex-grow-1">
              <i className="bi bi-download me-1" aria-hidden="true" />
              Download
            </a>
          </div>
        </div>
        {candidate.fileType === "PDF" ? (
          <iframe src={cvViewUrl} title={`CV of ${profile.name}`} className="w-100 border-0 hf-cv-frame rounded-bottom" />
        ) : (
          <div className="card-body text-center py-5 px-3">
            <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary fs-4 mb-3 hf-empty-icon">
              <i className="bi bi-file-earmark-word" aria-hidden="true" />
            </span>
            <h3 className="h6 fw-semibold text-body-emphasis">DOCX preview isn&apos;t available in the browser</h3>
            <p className="text-secondary mb-3">Download the file to open it in Word, or review the extracted information above.</p>
            <a href={cvDownloadUrl} download={candidate.fileName} className="btn btn-outline-primary">
              <i className="bi bi-download me-1" aria-hidden="true" />
              Download {candidate.fileType}
            </a>
          </div>
        )}
      </div>
    </>
  );
}
