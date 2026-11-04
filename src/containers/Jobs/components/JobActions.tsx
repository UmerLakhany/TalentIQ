import Link from "next/link";
import type { Job } from "@/data/jobs";

interface JobActionsProps {
  job: Job;
  onDelete: (job: Job) => void;
}

/** Three-dot menu used in the table and the phone cards. */
export default function JobActions({ job, onDelete }: JobActionsProps) {
  return (
    <div className="dropdown">
      <button
        type="button"
        className="btn hf-icon-btn rounded-3"
        data-bs-toggle="dropdown"
        data-bs-popper-config='{"strategy":"fixed"}'
        aria-expanded="false"
        aria-label={`Actions for ${job.title}`}
      >
        <i className="bi bi-three-dots-vertical" />
      </button>
      <ul className="dropdown-menu dropdown-menu-end shadow p-2">
        <li>
          <Link href={`/jobs/${job.id}`} className="dropdown-item rounded-2">
            <i className="bi bi-eye me-2 text-secondary" aria-hidden="true" />
            View Job &amp; Candidates
          </Link>
        </li>
        <li>
          <Link href={`/jobs/${job.id}#upload`} className="dropdown-item rounded-2">
            <i className="bi bi-cloud-arrow-up me-2 text-secondary" aria-hidden="true" />
            Upload CVs
          </Link>
        </li>
        <li>
          <Link href={`/jobs/${job.id}/edit`} className="dropdown-item rounded-2">
            <i className="bi bi-sliders me-2 text-secondary" aria-hidden="true" />
            Edit Criteria
          </Link>
        </li>
        <li>
          <hr className="dropdown-divider" />
        </li>
        <li>
          <button type="button" className="dropdown-item rounded-2 text-danger" onClick={() => onDelete(job)}>
            <i className="bi bi-trash3 me-2" aria-hidden="true" />
            Delete Job
          </button>
        </li>
      </ul>
    </div>
  );
}
