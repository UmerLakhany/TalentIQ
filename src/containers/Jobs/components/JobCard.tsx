import Link from "next/link";
import JobStatusBadge from "@/core/comman/JobStatusBadge";
import type { Job } from "@/data/jobs";
import { formatDate } from "@/utils/format";
import JobActions from "./JobActions";

interface JobCardProps {
  job: Job;
  onDelete: (job: Job) => void;
}

export default function JobCard({ job, onDelete }: JobCardProps) {
  const stats = [
    { label: "Applicants", value: job.applicants },
    { label: "Processing", value: job.processing },
    { label: "Shortlisted", value: job.shortlisted },
  ];

  return (
    <div className="card h-100 shadow-sm">
      <div className="card-body p-4 d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <div className="min-w-0">
            <Link href={`/jobs/${job.id}`} className="fw-semibold text-body-emphasis text-decoration-none">
              {job.title}
            </Link>
            <div className="small text-secondary">
              {job.department} · {job.employmentType}
            </div>
          </div>
          <JobActions job={job} onDelete={onDelete} />
        </div>

        <div className="d-flex flex-wrap gap-3 small text-secondary mb-3">
          <span>
            <i className="bi bi-geo-alt me-1" aria-hidden="true" />
            {job.location}
          </span>
          <span>
            <i className="bi bi-building me-1" aria-hidden="true" />
            {job.workplaceType}
          </span>
        </div>

        <div className="row g-0 text-center bg-body border rounded-3 py-2 mb-3">
          {stats.map((stat, index) => (
            <div key={stat.label} className={`col ${index > 0 ? "border-start" : ""}`}>
              <div className="fw-semibold text-body-emphasis">{stat.value}</div>
              <div className="small text-secondary">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="d-flex justify-content-between align-items-center mt-auto">
          <JobStatusBadge status={job.status} />
          <span className="small text-secondary">Created {formatDate(job.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
