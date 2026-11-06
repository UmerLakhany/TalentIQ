"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AutoRefreshProps {
  /** Only refresh while true (e.g. CVs are still being analyzed) */
  active: boolean;
  intervalMs?: number;
}

/**
 * Re-renders the current server page every `intervalMs` while `active`, so server-loaded data
 * (dashboard numbers) follows the background CV analysis without a manual reload.
 */
export default function AutoRefresh({ active, intervalMs = 10000 }: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs, router]);

  return null;
}
