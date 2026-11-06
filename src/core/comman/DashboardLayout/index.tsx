"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { isAuthRoute } from "@/constants/routes";
import Footer from "@/core/comman/Footer";
import Header from "@/core/comman/Header";
import Sidebar from "@/core/comman/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // While the mobile drawer is open: lock page scroll, close on Escape,
  // and close automatically if the screen grows to desktop size.
  useEffect(() => {
    if (!mobileOpen) return;
    const desktop = window.matchMedia("(min-width: 992px)");
    const close = () => setMobileOpen(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) close();
    };

    document.body.classList.add("overflow-hidden");
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpointChange);
    return () => {
      document.body.classList.remove("overflow-hidden");
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpointChange);
    };
  }, [mobileOpen]);

  // Login / forgot password render full-screen, without sidebar and header
  if (isAuthRoute(pathname)) return <>{children}</>;

  return (
    <div className="min-vh-100">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className={`hf-content d-flex flex-column min-vh-100 ${collapsed ? "is-collapsed" : ""}`}>
        <Header
          sidebarCollapsed={collapsed}
          mobileSidebarOpen={mobileOpen}
          onToggleSidebar={() => setCollapsed((value) => !value)}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />
        <main className="flex-grow-1 p-3 p-lg-4">
          <div className="hf-page">{children}</div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
