import { DYNAMIC_SEGMENT_LABELS, SEGMENT_LABELS, SKIPPED_SEGMENTS } from "@/constants/navigation";

export interface Crumb {
  label: string;
  href: string;
}

/**
 * Builds breadcrumbs from the current URL, always starting at Dashboard.
 * "/jobs/job-101/edit" -> Dashboard / Jobs / Job Details / Edit Criteria
 * "/candidates/cand-201" -> Dashboard / Jobs / Candidate Evaluation
 */
export function buildBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];

  segments.forEach((segment, index) => {
    if (SKIPPED_SEGMENTS.has(segment)) return;
    const parent = segments[index - 1];
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label =
      SEGMENT_LABELS[segment] ?? (parent && DYNAMIC_SEGMENT_LABELS[parent]) ?? segment.replace(/[-_]/g, " ");
    crumbs.push({ label, href });
  });

  // Candidate pages belong to a job, so they sit under Jobs
  if (segments[0] === "candidates") crumbs.unshift({ label: SEGMENT_LABELS.jobs, href: "/jobs" });
  if (segments[0] !== "dashboard") crumbs.unshift({ label: SEGMENT_LABELS.dashboard, href: "/dashboard" });
  return crumbs;
}
