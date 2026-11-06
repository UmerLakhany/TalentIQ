import { NextRequest } from "next/server";
import { forwardToBackend, pathParam } from "@/lib/backendRoute";

type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/jobs/:id/candidates?sort=score&status=completed  →  backend GET /jobs/:id/candidates
 *
 * Step 7 of the CV workflow: every CV of the job with its current status (queued / processing /
 * completed / failed), score, rank and AI evaluation, plus a progress summary. Cached in Redis by
 * the backend and refreshed as soon as the worker finishes a CV.
 */
export async function GET(req: NextRequest, { params }: Context) {
  const { id } = await params;
  return forwardToBackend(req, "GET", `/jobs/${pathParam(id)}/candidates`);
}
