"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, MouseEvent, useState } from "react";
import { SuccessToaster } from "@/components/Toaster";
import { mockNotifications, type AppNotification, type NotificationType } from "@/data/notifications";
import { mockCurrentUser } from "@/data/user";
import { buildBreadcrumbs } from "@/utils/breadcrumbs";
import { formatRelativeTime, getInitials } from "@/utils/format";

const NOTIFICATION_META: Record<NotificationType, { icon: string; tone: string }> = {
  processing_completed: { icon: "bi-check-circle", tone: "success" },
  processing_failed: { icon: "bi-exclamation-triangle", tone: "danger" },
  new_analysis: { icon: "bi-stars", tone: "primary" },
  candidate_shortlisted: { icon: "bi-star", tone: "warning" },
  job_activity: { icon: "bi-briefcase", tone: "info" },
};

interface HeaderProps {
  /** Desktop: collapse / expand the sidebar */
  onToggleSidebar: () => void;
  /** Mobile & tablet: open the sidebar drawer */
  onOpenMobileSidebar: () => void;
}

export default function Header({ onToggleSidebar, onOpenMobileSidebar }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = mockCurrentUser;

  const [search, setSearch] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);

  const crumbs = buildBreadcrumbs(pathname);
  const pageTitle = crumbs[crumbs.length - 1]?.label ?? "Dashboard";
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = search.trim();
    if (!term) return;
    router.push(`/candidates?search=${encodeURIComponent(term)}`);
    setSearch("");
    setShowMobileSearch(false);
  };

  const markAllAsRead = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // keep the dropdown open
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const openNotification = (notification: AppNotification) => {
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
    if (notification.link) router.push(notification.link);
  };

  const handleLogout = () => {
    SuccessToaster("You have been logged out.");
    router.push("/login");
  };

  const searchForm = (autoFocus = false) => (
    <form role="search" onSubmit={handleSearch} className="position-relative w-100">
      <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary" aria-hidden="true" />
      <input
        type="search"
        className="form-control bg-body ps-5"
        placeholder="Search candidates by name or skill…"
        aria-label="Search candidates"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus={autoFocus}
      />
    </form>
  );

  return (
    <header className="sticky-top bg-white border-bottom">
      <div className="hf-header d-flex align-items-center gap-2 gap-md-3 px-3 px-lg-4">
        {/* Sidebar toggles */}
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

        {/* Title + breadcrumb */}
        <div className="flex-grow-1 min-w-0">
          <h1 className="fs-6 fw-semibold text-body-emphasis mb-0 text-truncate">{pageTitle}</h1>
          {crumbs.length > 1 && (
            <nav aria-label="breadcrumb" className="d-none d-sm-block">
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

        {/* Global search (laptop & desktop) */}
        <div className="hf-header-search d-none d-lg-block">{searchForm()}</div>

        <div className="d-flex align-items-center gap-1 flex-shrink-0">
          {/* Search toggle (phone & tablet) */}
          <button
            type="button"
            className="btn hf-icon-btn rounded-3 d-lg-none"
            onClick={() => setShowMobileSearch((v) => !v)}
            aria-expanded={showMobileSearch}
            aria-label={showMobileSearch ? "Close search" : "Open search"}
          >
            <i className={`bi ${showMobileSearch ? "bi-x-lg" : "bi-search"}`} />
          </button>

          {/* Notifications */}
          <div className="dropdown">
            <button
              type="button"
              className="btn hf-icon-btn rounded-3"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
              title="Notifications"
            >
              <span className="position-relative d-inline-flex">
                <i className="bi bi-bell" />
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
            </button>

            <div className="dropdown-menu dropdown-menu-end shadow p-0 overflow-hidden hf-dropdown-notifications">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 py-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <h6 className="mb-0 fw-semibold">Notifications</h6>
                  {unreadCount > 0 && (
                    <span className="badge rounded-pill bg-primary-subtle text-primary">{unreadCount} new</span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-decoration-none"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <i className="bi bi-check2-all me-1" />
                  Mark all as read
                </button>
              </div>

              <div className="hf-notification-list">
                {notifications.length === 0 ? (
                  <div className="text-center text-secondary p-4">
                    <i className="bi bi-bell-slash fs-3 d-block mb-2" />
                    <p className="small mb-0">You&apos;re all caught up.</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const meta = NOTIFICATION_META[notification.type];
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        className="dropdown-item d-flex align-items-start gap-3 px-3 py-3 border-bottom text-wrap"
                        onClick={() => openNotification(notification)}
                      >
                        <span
                          className={`hf-icon-circle rounded-circle d-inline-flex align-items-center justify-content-center bg-${meta.tone}-subtle text-${meta.tone}-emphasis`}
                        >
                          <i className={`bi ${meta.icon}`} />
                        </span>
                        <span className="flex-grow-1 min-w-0">
                          <span className={`d-block text-body-emphasis ${notification.read ? "" : "fw-semibold"}`}>
                            {notification.title}
                          </span>
                          <span className="d-block small text-secondary">{notification.message}</span>
                          <span className="d-block small text-secondary mt-1" suppressHydrationWarning>
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </span>
                        {!notification.read && (
                          <span className="p-1 mt-2 bg-primary rounded-circle flex-shrink-0">
                            <span className="visually-hidden">Unread</span>
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Help */}
          <Link
            href="/help"
            className="btn hf-icon-btn rounded-3 d-none d-sm-inline-flex"
            aria-label="Help & Support"
            title="Help & Support"
          >
            <i className="bi bi-question-circle" />
          </Link>

          <div className="vr mx-2 my-3 d-none d-lg-block" />

          {/* Profile */}
          <div className="dropdown">
            <button
              type="button"
              className="btn hf-profile-toggle d-flex align-items-center gap-2 border-0 rounded-3 px-2 py-1"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              aria-label="Open profile menu"
            >
              <span className="hf-avatar rounded-circle bg-primary-subtle text-primary fw-semibold d-inline-flex align-items-center justify-content-center">
                {getInitials(user.fullName)}
              </span>
              <span className="d-none d-xl-block text-start lh-sm text-nowrap">
                <span className="d-block fw-semibold text-body-emphasis">{user.fullName}</span>
                <span className="d-block small text-secondary">{user.jobTitle}</span>
              </span>
              <i className="bi bi-chevron-down small text-secondary d-none d-xl-block" />
            </button>

            <ul className="dropdown-menu dropdown-menu-end shadow p-2">
              <li className="px-2 py-2">
                <div className="fw-semibold text-body-emphasis">{user.fullName}</div>
                <div className="small text-secondary">{user.email}</div>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <Link href="/settings" className="dropdown-item rounded-2">
                  <i className="bi bi-person me-2 text-secondary" />
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/help" className="dropdown-item rounded-2">
                  <i className="bi bi-life-preserver me-2 text-secondary" />
                  Help &amp; Support
                </Link>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button type="button" className="dropdown-item rounded-2 text-danger" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2" />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Global search (phone & tablet) */}
      {showMobileSearch && <div className="d-lg-none border-top px-3 py-2">{searchForm(true)}</div>}
    </header>
  );
}
