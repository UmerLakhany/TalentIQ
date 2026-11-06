"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorToaster, SuccessToaster } from "@/components/Toaster";
import AnalysisProgress from "@/core/comman/AnalysisProgress";
import PageHeader from "@/core/comman/PageHeader";
import ConfirmDialog from "@/core/modals/ConfirmDialog";
import type { Job } from "@/data/jobs";
import { deleteJob, listJobs } from "@/services/jobService";
import { formatDate } from "@/utils/format";
import { getJobSummaryFromApi } from "@/utils/jobs";
import JobActions from "./components/JobActions";

/** The list shows every job on one page (newest first). */
const PAGE_SIZE = 100;

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Changing this reloads the list (used by "Try again")
  const [reloadKey, setReloadKey] = useState(0);

  // *For Fetch Jobs (GET /jobs)
  useEffect(() => {
    let cancelled = false; // ignore a late reply if the page was left or reloaded meanwhile

    listJobs({ limit: PAGE_SIZE, sort: "newest" })
      .then(({ data }) => {
        if (cancelled) return;
        setJobs(data.jobs);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Something went wrong");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  // *For Delete Job (DELETE /jobs/:id)
  const confirmDelete = async () => {
    if (!jobToDelete) return;
    setDeleting(true);
    try {
      const { message } = await deleteJob(jobToDelete.id);
      setJobs((prev) => prev.filter((job) => job.id !== jobToDelete.id));
      SuccessToaster(message);
      setJobToDelete(null);
    } catch (error: unknown) {
      ErrorToaster(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  const rows = jobs.map((job) => ({ job, summary: getJobSummaryFromApi(job) }));

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Define job criteria, upload CVs and review AI-ranked candidates for each position."
        actions={
          <Link href="/jobs/create" className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2">
            <i className="bi bi-plus-lg" aria-hidden="true" />
            Create Job
          </Link>
        }
      />

      {loading ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5" role="status">
            <span className="spinner-border text-primary mb-3" aria-hidden="true" />
            <p className="text-secondary mb-0">Loading jobs…</p>
          </div>
        </div>
      ) : loadError ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger-subtle text-danger fs-4 mb-3 hf-empty-icon">
              <i className="bi bi-exclamation-triangle" aria-hidden="true" />
            </span>
            <h3 className="h6 fw-semibold text-body-emphasis">Couldn&apos;t load jobs</h3>
            <p className="text-secondary mb-3">{loadError}</p>
            <button type="button" className="btn btn-primary" onClick={retry}>
              <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />
              Try again
            </button>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary fs-4 mb-3 hf-empty-icon">
              <i className="bi bi-briefcase" aria-hidden="true" />
            </span>
            <h3 className="h6 fw-semibold text-body-emphasis">No jobs yet</h3>
            <p className="text-secondary mb-3">Create your first job to start screening CVs.</p>
            <Link href="/jobs/create" className="btn btn-primary">
              <i className="bi bi-plus-lg me-2" aria-hidden="true" />
              Create Job
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Tablet and up: table */}
          <div className="card shadow-sm overflow-hidden d-none d-md-block">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 hf-table">
                <thead>
                  <tr>
                    <th scope="col">Job Position</th>
                    <th scope="col" className="d-none d-lg-table-cell">Requirements</th>
                    <th scope="col">CV Analysis</th>
                    <th scope="col" className="d-none d-xl-table-cell">Created</th>
                    <th scope="col" className="text-end">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ job, summary }) => (
                    <tr key={job.id}>
                      <td className="hf-cell-wide">
                        <Link href={`/jobs/${job.id}`} className="fw-semibold text-body-emphasis text-decoration-none">
                          {job.title}
                        </Link>
                        <div className="small text-secondary text-truncate">{job.description}</div>
                        {/* Requirement counts move here when their column is hidden */}
                        <div className="small text-secondary d-lg-none">
                          {summary.mandatory} mandatory · {summary.preferred} preferred · min {job.minExperience} yrs
                        </div>
                      </td>
                      <td className="d-none d-lg-table-cell text-nowrap">
                        <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis me-1">
                          {summary.mandatory} mandatory
                        </span>
                        <span className="badge rounded-pill bg-info-subtle text-info-emphasis">
                          {summary.preferred} preferred
                        </span>
                        <div className="small text-secondary mt-1">Min {job.minExperience} yrs experience</div>
                      </td>
                      <td>
                        <AnalysisProgress summary={summary} />
                      </td>
                      <td className="d-none d-xl-table-cell text-nowrap text-secondary">{formatDate(job.createdAt)}</td>
                      <td className="text-end">
                        <JobActions job={job} onDelete={setJobToDelete} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Phones: cards */}
          <div className="row g-3 d-md-none">
            {rows.map(({ job, summary }) => (
              <div key={job.id} className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-start gap-2 mb-2">
                      <div className="flex-grow-1 min-w-0">
                        <Link href={`/jobs/${job.id}`} className="fw-semibold text-body-emphasis text-decoration-none">
                          {job.title}
                        </Link>
                        <div className="small text-secondary">Created {formatDate(job.createdAt)}</div>
                      </div>
                      <JobActions job={job} onDelete={setJobToDelete} />
                    </div>
                    <p className="small text-secondary mb-3">{job.description}</p>
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis">{summary.mandatory} mandatory</span>
                      <span className="badge rounded-pill bg-info-subtle text-info-emphasis">{summary.preferred} preferred</span>
                      <span className="badge rounded-pill bg-body-secondary text-secondary">Min {job.minExperience} yrs</span>
                    </div>
                    <div className="bg-body border rounded-3 p-2">
                      <AnalysisProgress summary={summary} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        show={jobToDelete !== null}
        title="Delete this job?"
        message={
          <>
            <span className="fw-semibold text-body-emphasis">{jobToDelete?.title}</span>, its criteria and all
            uploaded CVs and evaluations will be permanently removed.
          </>
        }
        confirmLabel={deleting ? "Deleting…" : "Delete Job"}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setJobToDelete(null)}
      />
    </>
  );
}
