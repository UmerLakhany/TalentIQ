import { NextRequest } from "next/server";
import { forwardToBackend, pathParam } from "@/lib/backendRoute";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/candidates/:id/retry  →  backend POST /candidates/:id/retry
 * Puts a failed CV back on the RabbitMQ queue (status "queued"). 409 if the CV isn't failed.
 */
export async function POST(req: NextRequest, { params }: Context) {
  const { id } = await params;
  return forwardToBackend(req, "POST", `/candidates/${pathParam(id)}/retry`);
}
