export interface NavItem {
  label: string;
  href: string;
  /** Bootstrap Icons class name, e.g. "bi-grid" */
  icon: string;
}

export const WORKSPACE_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "bi-grid-1x2" },
  { label: "Jobs", href: "/jobs", icon: "bi-briefcase" },
  { label: "Candidates", href: "/candidates", icon: "bi-people" },
  { label: "CV Screening", href: "/screening", icon: "bi-file-earmark-text" },
  { label: "Shortlisted", href: "/shortlisted", icon: "bi-star" },
  { label: "Analytics", href: "/analytics", icon: "bi-bar-chart-line" },
];

export const ACCOUNT_NAV: NavItem[] = [
  { label: "Settings", href: "/settings", icon: "bi-gear" },
  { label: "Help & Support", href: "/help", icon: "bi-question-circle" },
];

/** Labels for static URL segments — used by the header title and breadcrumbs. */
export const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  jobs: "Jobs",
  create: "Create Job",
  edit: "Edit Job",
  criteria: "Edit Criteria",
  upload: "Upload CVs",
  processing: "Processing Monitor",
  candidates: "Candidates",
  compare: "Compare Candidates",
  screening: "CV Screening",
  shortlisted: "Shortlisted",
  analytics: "Analytics",
  settings: "Settings",
  help: "Help & Support",
};

/** Label for a dynamic `[id]` segment, keyed by the segment before it. */
export const DYNAMIC_SEGMENT_LABELS: Record<string, string> = {
  jobs: "Job Details",
  candidates: "Candidate Profile",
};

/** Pages shown full-screen, without the sidebar / header / footer. */
export const AUTH_ROUTES = ["/login", "/register"];

/** True when `pathname` is the nav item's route or one of its child routes. */
export const isActiveRoute = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);
