"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SuccessToaster } from "@/components/Toaster";
import { ACCOUNT_NAV, WORKSPACE_NAV, isActiveRoute, type NavItem } from "@/constants/navigation";

interface SidebarProps {
  /** Desktop: show icons only */
  collapsed: boolean;
  /** Mobile & tablet: drawer is open */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const linkClasses = "hf-sidebar-link nav-link position-relative d-flex align-items-center gap-3 rounded-3 px-3 py-2";

function SidebarTooltip({ label }: { label: string }) {
  return (
    <span className="tooltip bs-tooltip-end hf-sidebar-tooltip" role="tooltip" aria-hidden="true">
      <span className="tooltip-arrow" />
      <span className="tooltip-inner">{label}</span>
    </span>
  );
}

function SidebarLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`${linkClasses} ${active ? "active bg-primary-subtle text-primary fw-semibold" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <i className={`bi ${item.icon}`} aria-hidden="true" />
      <span className="hf-sidebar-label">{item.label}</span>
      <SidebarTooltip label={item.label} />
    </Link>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    onCloseMobile();
    SuccessToaster("You have been logged out.");
    router.push("/login");
  };

  const renderSection = (title: string, items: NavItem[]) => (
    <>
      <p className="hf-sidebar-label text-uppercase small fw-semibold text-secondary px-3 mb-2">{title}</p>
      <ul className="nav flex-column gap-1">
        {items.map((item) => (
          <li key={item.href} className="nav-item">
            <SidebarLink item={item} active={isActiveRoute(pathname, item.href)} onNavigate={onCloseMobile} />
          </li>
        ))}
      </ul>
    </>
  );

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
            <div className="small text-secondary text-truncate">AI Recruitment Platform</div>
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
          {renderSection("Workspace", WORKSPACE_NAV)}

          <hr className="my-3 text-secondary" />

          {renderSection("Account", ACCOUNT_NAV)}
          <ul className="nav flex-column mt-1">
            <li className="nav-item">
              <button type="button" className={`${linkClasses} w-100`} onClick={handleLogout}>
                <i className="bi bi-box-arrow-right" aria-hidden="true" />
                <span className="hf-sidebar-label">Logout</span>
                <SidebarTooltip label="Logout" />
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}
