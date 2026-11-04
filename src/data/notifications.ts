export type NotificationType =
  | "processing_completed"
  | "processing_failed"
  | "new_analysis"
  | "candidate_shortlisted"
  | "job_activity";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  /** ISO 8601 timestamp */
  createdAt: string;
  read: boolean;
  /** In-app route the notification opens */
  link?: string;
}

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

// Mock notifications — replace with the notifications API later.
export const mockNotifications: AppNotification[] = [
  {
    id: "ntf-001",
    type: "processing_completed",
    title: "CV analysis completed",
    message: "All 12 CVs for Senior Backend Engineer have been analyzed and ranked.",
    createdAt: minutesAgo(6),
    read: false,
    link: "/jobs/job-101/candidates",
  },
  {
    id: "ntf-002",
    type: "processing_failed",
    title: "CV processing failed",
    message: "1 CV for Senior Backend Engineer could not be read. The PDF is password protected.",
    createdAt: minutesAgo(19),
    read: false,
    link: "/jobs/job-101/processing",
  },
  {
    id: "ntf-003",
    type: "new_analysis",
    title: "New strong match",
    message: "Ahmed Raza scored 92% for Senior Backend Engineer and meets all mandatory criteria.",
    createdAt: minutesAgo(64),
    read: false,
    link: "/candidates/cand-201",
  },
  {
    id: "ntf-004",
    type: "candidate_shortlisted",
    title: "Candidate shortlisted",
    message: "Maria Gonzalez was moved to Shortlisted for Product Designer.",
    createdAt: minutesAgo(180),
    read: true,
    link: "/shortlisted",
  },
  {
    id: "ntf-005",
    type: "job_activity",
    title: "Job published",
    message: "Frontend Developer (React) is now active and ready to receive CVs.",
    createdAt: minutesAgo(60 * 26),
    read: true,
    link: "/jobs/job-103",
  },
];
