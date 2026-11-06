import { NextRequest } from "next/server";
import { forwardToBackend, pathParam } from "@/lib/backendRoute";

type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/candidates/:id  →  backend GET /candidates/:id
 * The candidate's extracted profile, AI evaluation (verdict + evidence per requirement), score,
 * rank, and its job with requirements. 404 if missing or another recruiter's.
 */
export async function GET(req: NextRequest, { params }: Context) {
  const { id } = await params;
  return forwardToBackend(req, "GET", `/candidates/${pathParam(id)}`);
}

/** DELETE /api/candidates/:id  →  backend DELETE /candidates/:id (removes the CV file too) */
export async function DELETE(req: NextRequest, { params }: Context) {
  const { id } = await params;
  return forwardToBackend(req, "DELETE", `/candidates/${pathParam(id)}`);
}
