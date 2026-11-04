import Link from "next/link";
import JobStatusBadge from "@/core/comman/JobStatusBadge";
import type { Job } from "@/data/jobs";
import { formatDate } from "@/utils/format";
import JobActions from "./JobActions";

interface JobsTableProps {
  jobs: Job[];
  onDelete: (job: Job) => void;
}

export default function JobsTable({ jobs, onDelete }: JobsTableProps) {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0 hf-table">
        <thead>
          <tr>
            <th scope="col">Job Title</th>
            <th scope="col">Department</th>
            <th scope="col" className="d-none d-xl-table-cell">Employment Type</th>
            <th scope="col" className="text-center">Applicants</th>
            <th scope="col" className="text-center">Processing</th>
            <th scope="col" className="text-center">Shortlisted</th>
            <th scope="col">Status</th>
            <th scope="col" className="d-none d-xxl-table-cell">Created Date</th>
            <th scope="col" className="text-end">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>
                <Link href={`/jobs/${job.id}`} className="fw-semibold text-body-emphasis text-decoration-none text-nowrap">
                  {job.title}
                </Link>
                <div className="small text-secondary text-nowrap">
                  <i className="bi bi-geo-alt me-1" aria-hidden="true" />
                  {job.location} · {job.workplaceType}
                </div>
              </td>
              <td className="text-nowrap">
                {job.department}
                {/* Employment type moves under department when its column is hidden */}
                <div className="small text-secondary d-xl-none">{job.employmentType}</div>
              </td>
              <td className="text-nowrap d-none d-xl-table-cell">{job.employmentType}</td>
              <td className="text-center fw-semibold text-body-emphasis">{job.applicants}</td>
              <td className="text-center">
                {job.processing > 0 ? (
                  <span className="badge rounded-pill bg-primary-subtle text-primary fw-medium">
                    <i className="bi bi-arrow-repeat me-1" aria-hidden="true" />
                    {job.processing}
                  </span>
                ) : (
                  <span className="text-secondary">0</span>
                )}
              </td>
              <td className="text-center">{job.shortlisted}</td>
              <td>
                <JobStatusBadge status={job.status} />
                <div className="small text-secondary text-nowrap mt-1 d-xxl-none">{formatDate(job.createdAt)}</div>
              </td>
              <td className="text-nowrap text-secondary d-none d-xxl-table-cell">{formatDate(job.createdAt)}</td>
              <td className="text-end">
                <JobActions job={job} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
