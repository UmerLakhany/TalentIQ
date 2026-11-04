"use client";

import Link from "next/link";
import { useState } from "react";
import { SuccessToaster } from "@/components/Toaster";
import PageHeader from "@/core/comman/PageHeader";
import ConfirmDialog from "@/core/modals/ConfirmDialog";
import { DEPARTMENTS, JOB_STATUSES, mockJobs, type Job, type JobStatus } from "@/data/jobs";
import JobCard from "./components/JobCard";
import JobsTable from "./components/JobsTable";

type StatusFilter = "All" | JobStatus;
type SortOrder = "newest" | "oldest";
type ViewMode = "table" | "grid";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [department, setDepartment] = useState("All");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [view, setView] = useState<ViewMode>("table");
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  const statusTabs: { value: StatusFilter; count: number }[] = [
    { value: "All", count: jobs.length },
    ...JOB_STATUSES.map((s) => ({ value: s, count: jobs.filter((job) => job.status === s).length })),
  ];

  const term = search.trim().toLowerCase();
  const visibleJobs = jobs
    .filter((job) => !term || job.title.toLowerCase().includes(term))
    .filter((job) => status === "All" || job.status === status)
    .filter((job) => department === "All" || job.department === department)
    .sort((a, b) =>
      sortOrder === "newest" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)
    );

  const hasFilters = term !== "" || status !== "All" || department !== "All";

  const clearFilters = () => {
    setSearch("");
    setStatus("All");
    setDepartment("All");
  };

  const confirmDelete = () => {
    if (!jobToDelete) return;
    setJobs((prev) => prev.filter((job) => job.id !== jobToDelete.id));
    SuccessToaster(`"${jobToDelete.title}" was deleted.`);
    setJobToDelete(null);
  };

  return (
    <>
      <PageHeader
        title="Job Management"
        description="Create and manage your recruitment openings."
        actions={
          <Link href="/jobs/create" className="btn btn-primary d-inline-flex align-items-center gap-2">
            <i className="bi bi-plus-lg" aria-hidden="true" />
            Create New Job
          </Link>
        }
      />

      {/* Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white px-3 px-lg-4 pt-2 pb-0">
          <ul className="nav nav-underline flex-nowrap overflow-x-auto text-nowrap">
            {statusTabs.map((tab) => (
              <li key={tab.value} className="nav-item">
                <button
                  type="button"
                  className={`nav-link d-flex align-items-center gap-2 ${status === tab.value ? "active text-primary" : "text-secondary"}`}
                  onClick={() => setStatus(tab.value)}
                  aria-current={status === tab.value ? "true" : undefined}
                >
                  {tab.value === "All" ? "All Jobs" : tab.value}
                  <span
                    className={`badge rounded-pill ${
                      status === tab.value ? "bg-primary-subtle text-primary" : "bg-body-secondary text-secondary"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-body px-3 px-lg-4">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-lg">
              <div className="position-relative">
                <i
                  className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  className="form-control ps-5"
                  placeholder="Search jobs by title…"
                  aria-label="Search jobs by title"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg-auto">
              <select
                className="form-select"
                aria-label="Filter by department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="All">All departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-4 col-lg-auto">
              <select
                className="form-select"
                aria-label="Sort by creation date"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
            {/* View switch only matters from tablet up (phones always show cards) */}
            <div className="col-md-4 col-lg-auto d-none d-md-flex justify-content-end">
              <div className="btn-group" role="group" aria-label="Choose view">
                <button
                  type="button"
                  className={`btn ${view === "table" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setView("table")}
                  aria-pressed={view === "table"}
                  title="Table view"
                >
                  <i className="bi bi-list-ul" aria-hidden="true" />
                  <span className="ms-2 d-md-none d-xl-inline">Table</span>
                </button>
                <button
                  type="button"
                  className={`btn ${view === "grid" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setView("grid")}
                  aria-pressed={view === "grid"}
                  title="Grid view"
                >
                  <i className="bi bi-grid" aria-hidden="true" />
                  <span className="ms-2 d-md-none d-xl-inline">Grid</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result count */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <p className="small text-secondary mb-0">
          Showing <span className="fw-semibold text-body-emphasis">{visibleJobs.length}</span> of {jobs.length} jobs
        </p>
        {hasFilters && (
          <button type="button" className="btn btn-link btn-sm text-decoration-none p-0" onClick={clearFilters}>
            <i className="bi bi-x-circle me-1" aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      {visibleJobs.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary fs-4 mb-3 hf-empty-icon">
              <i className="bi bi-briefcase" aria-hidden="true" />
            </span>
            <h3 className="h6 fw-semibold text-body-emphasis">
              {jobs.length === 0 ? "No jobs yet" : "No jobs match your filters"}
            </h3>
            <p className="text-secondary mb-3">
              {jobs.length === 0
                ? "Create your first job opening to start screening CVs with AI."
                : "Try a different search term, status or department."}
            </p>
            {jobs.length === 0 ? (
              <Link href="/jobs/create" className="btn btn-primary">
                <i className="bi bi-plus-lg me-2" aria-hidden="true" />
                Create New Job
              </Link>
            ) : (
              <button type="button" className="btn btn-outline-primary" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Table view — tablet and up only; phones always get cards */}
          {view === "table" && (
            <div className="card shadow-sm overflow-hidden d-none d-md-block">
              <JobsTable jobs={visibleJobs} onDelete={setJobToDelete} />
            </div>
          )}
          <div className={`row g-3 ${view === "table" ? "d-md-none" : ""}`}>
            {visibleJobs.map((job) => (
              <div key={job.id} className="col-12 col-sm-6 col-md-6 col-xxl-4">
                <JobCard job={job} onDelete={setJobToDelete} />
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
            <span className="fw-semibold text-body-emphasis">{jobToDelete?.title}</span> and its{" "}
            {jobToDelete?.applicants ?? 0} candidate records will be permanently removed. This can&apos;t be undone.
          </>
        }
        confirmLabel="Delete Job"
        onConfirm={confirmDelete}
        onCancel={() => setJobToDelete(null)}
      />
    </>
  );
}
