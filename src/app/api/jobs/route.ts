import { NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/backendRoute";

/**
 * GET /api/jobs?page=1&limit=10&search=dev&sort=newest  →  backend GET /jobs
 * Reply: { data: { jobs: Job[] (with cvSummary), pagination: { page, limit, total, totalPages } } }
 */
export async function GET(req: NextRequest) {
  return forwardToBackend(req, "GET", "/jobs");
}

/**
 * POST /api/jobs  →  backend POST /jobs
 * Body: the job form (title, description, minExperience, experienceType, skills, education, otherRequirements)
 * Reply (201): the created Job.
 */
export async function POST(req: NextRequest) {
  return forwardToBackend(req, "POST", "/jobs");
}
