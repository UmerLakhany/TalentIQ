export interface NavItem {
  label: string;
  href: string;
  /** Bootstrap Icons class name */
  icon: string;
  isActive: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "bi-grid-1x2",
    isActive: (p) => p === "/dashboard",
  },
  {
    label: "Jobs",
    href: "/jobs",
    icon: "bi-briefcase",
    // Job pages and candidate evaluations all live under a job
    isActive: (p) => (p.startsWith("/jobs") && p !== "/jobs/create") || p.startsWith("/candidates"),
  },
  {
    label: "Create Job",
    href: "/jobs/create",
    icon: "bi-plus-square",
    isActive: (p) => p === "/jobs/create",
  },
];

/** Labels for static URL segments — used by the header title and breadcrumbs. */
export const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  jobs: "Jobs",
  create: "Create Job",
  edit: "Edit Criteria",
};

/** Label for a dynamic `[id]` segment, keyed by the segment before it. */
export const DYNAMIC_SEGMENT_LABELS: Record<string, string> = {
  jobs: "Job Details",
  candidates: "Candidate Evaluation",
};

/** Segments with no page of their own — skipped in breadcrumbs. */
export const SKIPPED_SEGMENTS = new Set(["candidates"]);
