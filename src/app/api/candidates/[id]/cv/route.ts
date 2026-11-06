import { NextRequest, NextResponse } from "next/server";
import { isAxiosError } from "axios";
import { pathParam } from "@/lib/backendRoute";
import serverApi from "@/lib/serverApi";

type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/candidates/:id/cv            → the original CV, shown in the browser (PDF preview)
 * GET /api/candidates/:id/cv?download=1 → the same file as a download with its original name
 *
 * Fetched from the backend (GET /candidates/:id/cv) with the session cookie and served from this
 * app's own origin, so <iframe> previews and <a download> work and the backend URL stays private.
 */
export async function GET(req: NextRequest, { params }: Context) {
  const { id } = await params;
  const download = new URL(req.url).searchParams.get("download") === "1";

  try {
    const server = await serverApi();
    const res = await server.get<ArrayBuffer>(`/candidates/${pathParam(id)}/cv`, {
      params: download ? { download: "1" } : undefined,
      responseType: "arraybuffer",
    });

    const headers = new Headers({
      "Content-Type": String(res.headers["content-type"] ?? "application/octet-stream"),
      "Content-Disposition": String(res.headers["content-disposition"] ?? (download ? "attachment" : "inline")),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=300",
    });
    return new NextResponse(res.data, { status: 200, headers });
  } catch (error) {
    // Error bodies are JSON from the backend, but arrive as bytes because of responseType
    if (isAxiosError(error) && error.response) {
      let body: unknown = { success: false, statusCode: error.response.status, message: "Could not load the CV file." };
      try {
        body = JSON.parse(Buffer.from(error.response.data as ArrayBuffer).toString("utf8"));
      } catch {
        // keep the generic message
      }
      return NextResponse.json(body, { status: error.response.status });
    }
    return NextResponse.json(
      { success: false, statusCode: 503, message: "Cannot reach the server. Please try again." },
      { status: 503 }
    );
  }
}
