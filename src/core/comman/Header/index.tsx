"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildBreadcrumbs } from "@/utils/breadcrumbs";

interface HeaderProps {
  /** Desktop: collapse / expand the sidebar */
  onToggleSidebar: () => void;
  /** Phones & tablets: open the sidebar drawer */
  onOpenMobileSidebar: () => void;
}

export default function Header({ onToggleSidebar, onOpenMobileSidebar }: HeaderProps) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);
  const pageTitle = crumbs[crumbs.length - 1]?.label ?? "Jobs";

  return (
    <header className="sticky-top bg-white border-bottom">
      <div className="hf-header d-flex align-items-center gap-2 gap-md-3 px-3 px-lg-4">
        <button
          type="button"
          className="btn hf-icon-btn rounded-3 d-lg-none"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation"
        >
          <i className="bi bi-list" />
        </button>
        <button
          type="button"
          className="btn hf-icon-btn rounded-3 d-none d-lg-inline-flex"
          onClick={onToggleSidebar}
          aria-label="Collapse or expand sidebar"
          title="Collapse / expand sidebar"
        >
          <i className="bi bi-layout-sidebar" />
        </button>

        <div className="flex-grow-1 min-w-0">
          <h1 className="fs-6 fw-semibold text-body-emphasis mb-0 text-truncate">{pageTitle}</h1>
          {crumbs.length > 1 && (
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0 flex-nowrap text-nowrap overflow-hidden">
                {crumbs.map((crumb, index) =>
                  index === crumbs.length - 1 ? (
                    <li key={crumb.href} className="breadcrumb-item active text-truncate" aria-current="page">
                      {crumb.label}
                    </li>
                  ) : (
                    <li key={crumb.href} className="breadcrumb-item">
                      <Link href={crumb.href} className="link-secondary text-decoration-none">
                        {crumb.label}
                      </Link>
                    </li>
                  )
                )}
              </ol>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
