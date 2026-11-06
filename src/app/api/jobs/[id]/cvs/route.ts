import { NextRequest, NextResponse } from "next/server";
import { backendErrorResponse, pathParam } from "@/lib/backendRoute";
import serverApi from "@/lib/serverApi";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/jobs/:id/cvs  →  backend POST /jobs/:id/cvs   (multipart/form-data, field "files")
 *
 * Step 1–3 of the CV workflow: the backend stores each PDF / DOCX, creates a "queued" candidate and
 * publishes one RabbitMQ message per CV for the background worker. It answers straight away:
 * { data: { jobId, uploaded, queued, candidates: Candidate[], rejected: [{ fileName, reason }] } }
 */
export async function POST(req: NextRequest, { params }: Context) {
  const { id } = await params;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { success: false, statusCode: 400, message: 'Send the CVs as form-data in the "files" field.' },
      { status: 400 }
    );
  }

  try {
    const server = await serverApi();
    // axios sets the multipart Content-Type (with boundary) from the FormData itself
    const res = await server.post(`/jobs/${pathParam(id)}/cvs`, form, {
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    return NextResponse.json(res.data, { status: res.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
