import { NextRequest } from "next/server";
import { forwardToBackend, pathParam } from "@/lib/backendRoute";

type Context = { params: Promise<{ id: string }> };

/** GET /api/jobs/:id  →  backend GET /jobs/:id (the Job with cvSummary; 404 if not found / not yours) */
export async function GET(req: NextRequest, { params }: Context) {
  const { id } = await params;
  return forwardToBackend(req, "GET", `/jobs/${pathParam(id)}`);
}

/**
 * PUT /api/jobs/:id  →  backend PUT /jobs/:id
 * Body: the full job form + reanalyze. Reply: the updated Job + reanalysis { criteriaChanged, requeued, rescored }.
 */
export async function PUT(req: NextRequest, { params }: Context) {
  const { id } = await params;
  return forwardToBackend(req, "PUT", `/jobs/${pathParam(id)}`);
}

/** DELETE /api/jobs/:id  →  backend DELETE /jobs/:id (also removes its CVs and candidates) */
export async function DELETE(req: NextRequest, { params }: Context) {
  const { id } = await params;
  return forwardToBackend(req, "DELETE", `/jobs/${pathParam(id)}`);
}
