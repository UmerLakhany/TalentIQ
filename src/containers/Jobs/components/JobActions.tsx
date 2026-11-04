import Link from "next/link";
import type { Job } from "@/data/jobs";

interface JobActionsProps {
  job: Job;
  onDelete: (job: Job) => void;
}

/** Three-dot action menu used in both the table and grid views. */
export default function JobActions({ job, onDelete }: JobActionsProps) {
  const links = [
    { label: "View Job", href: `/jobs/${job.id}`, icon: "bi-eye" },
    { label: "Edit Job", href: `/jobs/${job.id}/edit`, icon: "bi-pencil-square" },
    { label: "Edit Criteria", href: `/jobs/${job.id}/criteria`, icon: "bi-sliders" },
    { label: "Upload CVs", href: `/jobs/${job.id}/upload`, icon: "bi-cloud-arrow-up" },
    { label: "View Candidates", href: `/jobs/${job.id}/candidates`, icon: "bi-people" },
  ];

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
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="dropdown-item rounded-2">
              <i className={`bi ${link.icon} me-2 text-secondary`} aria-hidden="true" />
              {link.label}
            </Link>
          </li>
        ))}
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
