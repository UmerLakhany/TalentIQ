"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/constants/navigation";

interface SidebarProps {
  /** Desktop: show icons only */
  collapsed: boolean;
  /** Phones & tablets: drawer is open */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop behind the mobile drawer */}
      {mobileOpen && <div className="offcanvas-backdrop fade show d-lg-none" onClick={onCloseMobile} />}

      <aside
        className={`hf-sidebar bg-white border-end d-flex flex-column ${collapsed ? "is-collapsed" : ""} ${
          mobileOpen ? "is-open" : ""
        }`}
        aria-label="Main navigation"
      >
        {/* Branding */}
        <div className="hf-sidebar-brand d-flex align-items-center gap-2 px-3 border-bottom flex-shrink-0">
          <span className="hf-icon-circle rounded-3 bg-primary text-white d-inline-flex align-items-center justify-content-center">
            <i className="bi bi-stars" aria-hidden="true" />
          </span>
          <div className="hf-sidebar-label flex-grow-1 min-w-0 lh-sm">
            <div className="fw-bold text-body-emphasis">HireFlow AI</div>
            <div className="small text-secondary text-truncate">AI CV Screening</div>
          </div>
          <button
            type="button"
            className="btn hf-icon-btn rounded-3 d-lg-none"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="hf-sidebar-nav flex-grow-1 overflow-y-auto p-3">
          <p className="hf-sidebar-label text-uppercase small fw-semibold text-secondary px-3 mb-2">Recruitment</p>
          <ul className="nav flex-column gap-1">
            {NAV_ITEMS.map((item) => {
              const active = item.isActive(pathname);
              return (
                <li key={item.href} className="nav-item">
                  <Link
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`hf-sidebar-link nav-link position-relative d-flex align-items-center gap-3 rounded-3 px-3 py-2 ${
                      active ? "active bg-primary-subtle text-primary fw-semibold" : ""
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                    <span className="hf-sidebar-label">{item.label}</span>
                    {/* Shown on hover when the sidebar is collapsed */}
                    <span className="tooltip bs-tooltip-end hf-sidebar-tooltip" role="tooltip" aria-hidden="true">
                      <span className="tooltip-arrow" />
                      <span className="tooltip-inner">{item.label}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
