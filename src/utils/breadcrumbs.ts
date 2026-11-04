import { DYNAMIC_SEGMENT_LABELS, SEGMENT_LABELS } from "@/constants/navigation";

export interface Crumb {
  label: string;
  href: string;
}

const toTitleCase = (value: string) => value.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Builds breadcrumbs from the current URL, always starting at Dashboard.
 * "/jobs/job-101/candidates" -> Dashboard / Jobs / Job Details / Candidate Ranking
 */
export function buildBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const parent = segments[index - 1];
    const href = `/${segments.slice(0, index + 1).join("/")}`;

    let label: string;
    if (segment === "candidates" && segments[index - 2] === "jobs") {
      label = "Candidate Ranking";
    } else if (segment in SEGMENT_LABELS) {
      label = SEGMENT_LABELS[segment];
    } else if (parent && parent in DYNAMIC_SEGMENT_LABELS) {
      label = DYNAMIC_SEGMENT_LABELS[parent];
    } else {
      label = toTitleCase(segment);
    }
    return { label, href };
  });

  if (segments[0] !== "dashboard") {
    crumbs.unshift({ label: SEGMENT_LABELS.dashboard, href: "/dashboard" });
  }
  return crumbs;
}
