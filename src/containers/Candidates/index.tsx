"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { InfoToaster, SuccessToaster } from "@/components/Toaster";
import PageHeader from "@/core/comman/PageHeader";
import Pagination from "@/core/comman/Pagination";
import StatCard from "@/core/comman/StatCard";
import ConfirmDialog from "@/core/modals/ConfirmDialog";
import { getScoreBand, mockCandidates, type ApplicationStatus, type Candidate } from "@/data/candidates";
import CandidateCard from "./components/CandidateCard";
import CandidateFilters, {
  DEFAULT_FILTERS,
  EXPERIENCE_RANGES,
  type CandidateFilterState,
} from "./components/CandidateFilters";
import CandidatesTable, { type SortKey, type SortState } from "./components/CandidatesTable";

const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: string; label: string; sort: SortState }[] = [
  { value: "matchScore-desc", label: "Highest match score", sort: { key: "matchScore", direction: "desc" } },
  { value: "matchScore-asc", label: "Lowest match score", sort: { key: "matchScore", direction: "asc" } },
  { value: "experience-desc", label: "Most experience", sort: { key: "experience", direction: "desc" } },
  { value: "addedAt-desc", label: "Recently added", sort: { key: "addedAt", direction: "desc" } },
  { value: "name-asc", label: "Name (A–Z)", sort: { key: "name", direction: "asc" } },
];

function matchesFilters(candidate: Candidate, filters: CandidateFilterState): boolean {
  const term = filters.search.trim().toLowerCase();
  if (
    term &&
    !candidate.name.toLowerCase().includes(term) &&
    !candidate.email.toLowerCase().includes(term) &&
    !candidate.skills.some((skill) => skill.toLowerCase().includes(term))
  ) {
    return false;
  }
  if (filters.jobId !== "All" && candidate.jobId !== filters.jobId) return false;
  if (filters.skill !== "All" && !candidate.skills.includes(filters.skill)) return false;
  if (filters.applicationStatus !== "All" && candidate.applicationStatus !== filters.applicationStatus) return false;
  if (filters.analysisStatus !== "All" && candidate.analysisStatus !== filters.analysisStatus) return false;

  if (filters.scoreBand !== "All") {
    if (filters.scoreBand === "unscored") {
      if (candidate.matchScore !== null) return false;
    } else if (candidate.matchScore === null || getScoreBand(candidate.matchScore).key !== filters.scoreBand) {
      return false;
    }
  }

  if (filters.experience !== "All") {
    const range = EXPERIENCE_RANGES.find((r) => r.value === filters.experience);
    const years = candidate.experienceYears;
    if (!range || years === null || years < range.min || years > range.max) return false;
  }
  return true;
}

function compareCandidates(a: Candidate, b: Candidate, sort: SortState): number {
  const dir = sort.direction === "asc" ? 1 : -1;
  if (sort.key === "name") return a.name.localeCompare(b.name) * dir;
  if (sort.key === "addedAt") return a.addedAt.localeCompare(b.addedAt) * dir;

  const av = sort.key === "matchScore" ? a.matchScore : a.experienceYears;
  const bv = sort.key === "matchScore" ? b.matchScore : b.experienceYears;
  // Candidates without a value (not analyzed yet) always go last
  if (av === null && bv === null) return 0;
  if (av === null) return 1;
  if (bv === null) return -1;
  return (av - bv) * dir;
}

function CandidatesView({ initialSearch }: { initialSearch: string }) {
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [filters, setFilters] = useState<CandidateFilterState>({ ...DEFAULT_FILTERS, search: initialSearch });
  const [sort, setSort] = useState<SortState>({ key: "matchScore", direction: "desc" });
  const [page, setPage] = useState(1);
  const [candidateToReject, setCandidateToReject] = useState<Candidate | null>(null);

  // Dropdown options come from the data itself
  const jobOptions = [...new Map(candidates.map((c) => [c.jobId, { id: c.jobId, title: c.jobTitle }])).values()];
  const skillOptions = [...new Set(candidates.flatMap((c) => c.skills))].sort((a, b) => a.localeCompare(b));

  const filtered = candidates.filter((c) => matchesFilters(c, filters)).sort((a, b) => compareCandidates(a, b, sort));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasFilters = (Object.keys(DEFAULT_FILTERS) as (keyof CandidateFilterState)[]).some(
    (key) => filters[key] !== DEFAULT_FILTERS[key]
  );

  const stats = {
    total: candidates.length,
    analyzed: candidates.filter((c) => c.analysisStatus === "Completed").length,
    shortlisted: candidates.filter((c) => c.applicationStatus === "Shortlisted").length,
    review: candidates.filter((c) => c.applicationStatus === "Under Review").length,
  };

  const updateFilter = <K extends keyof CandidateFilterState>(key: K, value: CandidateFilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const handleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "name" ? "asc" : "desc" }
    );
    setPage(1);
  };

  const setStatus = (candidate: Candidate, status: ApplicationStatus) => {
    setCandidates((prev) => prev.map((c) => (c.id === candidate.id ? { ...c, applicationStatus: status } : c)));
    const messages: Record<ApplicationStatus, string> = {
      Shortlisted: `${candidate.name} was shortlisted.`,
      "Under Review": `${candidate.name} was marked for review.`,
      Rejected: `${candidate.name} was rejected.`,
      New: `${candidate.name} was moved back to New.`,
    };
    SuccessToaster(messages[status]);
  };

  const confirmReject = () => {
    if (candidateToReject) setStatus(candidateToReject, "Rejected");
    setCandidateToReject(null);
  };

  const downloadCv = (candidate: Candidate) => {
    InfoToaster(`${candidate.name}'s CV will download once the file service is connected.`);
  };

  const sortValue = SORT_OPTIONS.find((o) => o.sort.key === sort.key && o.sort.direction === sort.direction)?.value ?? "";

  const rowHandlers = { onStatusChange: setStatus, onReject: setCandidateToReject, onDownloadCv: downloadCv };

  return (
    <>
      <PageHeader
        title="Candidates"
        description="Explore and manage all candidates analyzed by your recruitment platform."
      />

      {/* Summary */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <StatCard label="Total Candidates" value={stats.total} icon="bi-people" />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard label="Analyses Completed" value={stats.analyzed} icon="bi-cpu" tone="info" hint={`${stats.total - stats.analyzed} pending`} />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard label="Shortlisted" value={stats.shortlisted} icon="bi-star" tone="success" />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard label="Marked for Review" value={stats.review} icon="bi-flag" tone="warning" />
        </div>
      </div>

      <CandidateFilters filters={filters} onChange={updateFilter} jobOptions={jobOptions} skillOptions={skillOptions} />

      {/* Result bar: count + sort */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-3">
        <div className="d-flex align-items-center gap-3">
          <p className="small text-secondary mb-0">
            <span className="fw-semibold text-body-emphasis">{filtered.length}</span> candidates found
          </p>
          {hasFilters && (
            <button type="button" className="btn btn-link btn-sm text-decoration-none p-0" onClick={clearFilters}>
              <i className="bi bi-x-circle me-1" aria-hidden="true" />
              Clear filters
            </button>
          )}
        </div>
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="candidate-sort" className="small text-secondary text-nowrap mb-0">
            Sort by
          </label>
          <select
            id="candidate-sort"
            className="form-select form-select-sm w-auto flex-grow-1 flex-sm-grow-0"
            value={sortValue}
            onChange={(e) => {
              const option = SORT_OPTIONS.find((o) => o.value === e.target.value);
              if (option) {
                setSort(option.sort);
                setPage(1);
              }
            }}
          >
            {sortValue === "" && <option value="">Custom</option>}
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary fs-4 mb-3 hf-empty-icon">
              <i className="bi bi-person-x" aria-hidden="true" />
            </span>
            <h3 className="h6 fw-semibold text-body-emphasis">No candidates match your filters</h3>
            <p className="text-secondary mb-3">Try a different name, skill or status.</p>
            <button type="button" className="btn btn-outline-primary" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Tablet and up: table */}
          <div className="card shadow-sm overflow-hidden d-none d-md-block">
            <CandidatesTable candidates={pageItems} sort={sort} onSort={handleSort} {...rowHandlers} />
            <div className="card-footer bg-white px-3 px-lg-4 py-3">
              <Pagination
                page={currentPage}
                pageSize={PAGE_SIZE}
                totalItems={filtered.length}
                onPageChange={setPage}
                itemLabel="candidates"
              />
            </div>
          </div>

          {/* Phones: cards */}
          <div className="d-md-none">
            <div className="row g-3 mb-3">
              {pageItems.map((candidate) => (
                <div key={candidate.id} className="col-12">
                  <CandidateCard candidate={candidate} {...rowHandlers} />
                </div>
              ))}
            </div>
            <Pagination
              page={currentPage}
              pageSize={PAGE_SIZE}
              totalItems={filtered.length}
              onPageChange={setPage}
              itemLabel="candidates"
            />
          </div>
        </>
      )}

      <ConfirmDialog
        show={candidateToReject !== null}
        title="Reject this candidate?"
        message={
          <>
            <span className="fw-semibold text-body-emphasis">{candidateToReject?.name}</span> will be marked as rejected for{" "}
            {candidateToReject?.jobTitle}. You can still change this later from their profile.
          </>
        }
        confirmLabel="Reject Candidate"
        onConfirm={confirmReject}
        onCancel={() => setCandidateToReject(null)}
      />
    </>
  );
}

/** Reads `?search=` from the header's global search and restarts the view when it changes. */
export default function CandidatesPage() {
  const search = useSearchParams().get("search") ?? "";
  return <CandidatesView key={search} initialSearch={search} />;
}
