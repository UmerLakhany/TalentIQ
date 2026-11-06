"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { route } from "@/constants/routes";
import { logoutUser } from "@/services/authService";
import { buildBreadcrumbs } from "@/utils/breadcrumbs";

interface HeaderProps {
  /** Desktop: the sidebar is collapsed to icons */
  sidebarCollapsed: boolean;
  /** Phones & tablets: the sidebar drawer is open */
  mobileSidebarOpen: boolean;
  /** Desktop: collapse / expand the sidebar */
  onToggleSidebar: () => void;
  /** Phones & tablets: open the sidebar drawer */
  onOpenMobileSidebar: () => void;
}

export default function Header({ sidebarCollapsed, mobileSidebarOpen, onToggleSidebar, onOpenMobileSidebar }: HeaderProps) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);
  const pageTitle = crumbs[crumbs.length - 1]?.label ?? "Jobs";

  const logout = async () => {
    try {
      // The session cookie is httpOnly, so only the server can remove it
      await logoutUser();
    } catch {
      // Even if the request fails, still leave the private pages
    } finally {
      // Full page load so no cached private pages remain in the client router
      window.location.replace(route.login);
    }
  };

  return (
    <header className="sticky-top bg-white border-bottom">
      <div className="hf-header d-flex align-items-center gap-2 gap-md-3 px-3 px-lg-4">
        {/* Phones & tablets: hamburger opens the sidebar drawer */}
        <button
          type="button"
          className="btn hf-icon-btn hf-menu-btn rounded-3 d-lg-none"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation"
          aria-controls="app-sidebar"
          aria-expanded={mobileSidebarOpen}
        >
          <i className="bi bi-list" aria-hidden="true" />
        </button>
        {/* Desktop: collapse the sidebar to icons / expand it again */}
        <button
          type="button"
          className="btn hf-icon-btn hf-menu-btn rounded-3 d-none d-lg-inline-flex"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-controls="app-sidebar"
          aria-expanded={!sidebarCollapsed}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i className={`bi ${sidebarCollapsed ? "bi-layout-sidebar-inset" : "bi-layout-sidebar"}`} aria-hidden="true" />
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

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2 rounded-3 flex-shrink-0"
          onClick={logout}
          aria-label="Log out"
          title="Log out"
        >
          <i className="bi bi-box-arrow-right" aria-hidden="true" />
          <span className="d-none d-sm-inline">Log out</span>
        </button>
      </div>
    </header>
  );
}
