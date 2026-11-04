"use client";

import { useState } from "react";
import {
  ANALYSIS_STATUSES,
  APPLICATION_STATUSES,
  MATCH_SCORE_BANDS,
  type AnalysisStatus,
  type ApplicationStatus,
  type ScoreBandKey,
} from "@/data/candidates";

export type ExperienceRange = "All" | "0-2" | "3-5" | "6-9" | "10+";

export interface CandidateFilterState {
  search: string;
  jobId: string;
  scoreBand: "All" | ScoreBandKey | "unscored";
  experience: ExperienceRange;
  skill: string;
  applicationStatus: "All" | ApplicationStatus;
  analysisStatus: "All" | AnalysisStatus;
}

export const DEFAULT_FILTERS: CandidateFilterState = {
  search: "",
  jobId: "All",
  scoreBand: "All",
  experience: "All",
  skill: "All",
  applicationStatus: "All",
  analysisStatus: "All",
};

export const EXPERIENCE_RANGES: { value: Exclude<ExperienceRange, "All">; label: string; min: number; max: number }[] = [
  { value: "0-2", label: "0–2 years", min: 0, max: 2 },
  { value: "3-5", label: "3–5 years", min: 3, max: 5 },
  { value: "6-9", label: "6–9 years", min: 6, max: 9 },
  { value: "10+", label: "10+ years", min: 10, max: Infinity },
];

interface CandidateFiltersProps {
  filters: CandidateFilterState;
  onChange: <K extends keyof CandidateFilterState>(key: K, value: CandidateFilterState[K]) => void;
  jobOptions: { id: string; title: string }[];
  skillOptions: string[];
}

export default function CandidateFilters({ filters, onChange, jobOptions, skillOptions }: CandidateFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Number of dropdown filters in use (search is visible, so not counted)
  const activeCount = (Object.keys(DEFAULT_FILTERS) as (keyof CandidateFilterState)[]).filter(
    (key) => key !== "search" && filters[key] !== DEFAULT_FILTERS[key]
  ).length;

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body px-3 px-lg-4">
        <div className="d-flex gap-2">
          <div className="position-relative flex-grow-1">
            <i
              className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
              aria-hidden="true"
            />
            <input
              type="search"
              className="form-control ps-5"
              placeholder="Search by candidate name, email or skill…"
              aria-label="Search candidates"
              value={filters.search}
              onChange={(e) => onChange("search", e.target.value)}
            />
          </div>

          {/* Phones & tablets: filters fold behind this button */}
          <button
            type="button"
            className={`btn d-lg-none d-inline-flex align-items-center gap-2 flex-shrink-0 ${
              showMobileFilters ? "btn-primary" : "btn-outline-secondary"
            }`}
            onClick={() => setShowMobileFilters((v) => !v)}
            aria-expanded={showMobileFilters}
            aria-controls="candidate-filters"
          >
            <i className="bi bi-funnel" aria-hidden="true" />
            <span className="d-none d-sm-inline">Filters</span>
            {activeCount > 0 && (
              <span className={`badge rounded-pill ${showMobileFilters ? "bg-white text-primary" : "bg-primary"}`}>
                {activeCount}
              </span>
            )}
          </button>
        </div>

        <div id="candidate-filters" className={`row g-2 mt-1 ${showMobileFilters ? "" : "d-none"} d-lg-flex`}>
          <div className="col-12 col-sm-6 col-lg-4 col-xxl-2">
            <label className="form-label small text-secondary mb-1" htmlFor="filter-job">
              Job position
            </label>
            <select
              id="filter-job"
              className="form-select"
              value={filters.jobId}
              onChange={(e) => onChange("jobId", e.target.value)}
            >
              <option value="All">All positions</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6 col-lg-4 col-xxl-2">
            <label className="form-label small text-secondary mb-1" htmlFor="filter-score">
              Match score
            </label>
            <select
              id="filter-score"
              className="form-select"
              value={filters.scoreBand}
              onChange={(e) => onChange("scoreBand", e.target.value as CandidateFilterState["scoreBand"])}
            >
              <option value="All">Any score</option>
              {MATCH_SCORE_BANDS.map((band, i) => (
                <option key={band.key} value={band.key}>
                  {band.label} ({i === 0 ? `${band.min}+` : `${band.min}–${MATCH_SCORE_BANDS[i - 1].min - 1}`})
                </option>
              ))}
              <option value="unscored">Not analyzed yet</option>
            </select>
          </div>

          <div className="col-12 col-sm-6 col-lg-4 col-xxl-2">
            <label className="form-label small text-secondary mb-1" htmlFor="filter-experience">
              Experience
            </label>
            <select
              id="filter-experience"
              className="form-select"
              value={filters.experience}
              onChange={(e) => onChange("experience", e.target.value as ExperienceRange)}
            >
              <option value="All">Any experience</option>
              {EXPERIENCE_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6 col-lg-4 col-xxl-2">
            <label className="form-label small text-secondary mb-1" htmlFor="filter-skill">
              Technical skill
            </label>
            <select
              id="filter-skill"
              className="form-select"
              value={filters.skill}
              onChange={(e) => onChange("skill", e.target.value)}
            >
              <option value="All">Any skill</option>
              {skillOptions.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6 col-lg-4 col-xxl-2">
            <label className="form-label small text-secondary mb-1" htmlFor="filter-application">
              Application status
            </label>
            <select
              id="filter-application"
              className="form-select"
              value={filters.applicationStatus}
              onChange={(e) => onChange("applicationStatus", e.target.value as CandidateFilterState["applicationStatus"])}
            >
              <option value="All">All statuses</option>
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6 col-lg-4 col-xxl-2">
            <label className="form-label small text-secondary mb-1" htmlFor="filter-analysis">
              Analysis status
            </label>
            <select
              id="filter-analysis"
              className="form-select"
              value={filters.analysisStatus}
              onChange={(e) => onChange("analysisStatus", e.target.value as CandidateFilterState["analysisStatus"])}
            >
              <option value="All">All analyses</option>
              {ANALYSIS_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
