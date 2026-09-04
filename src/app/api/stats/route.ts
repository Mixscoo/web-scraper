import { NextResponse, type NextRequest } from "next/server";
import { jobStore } from "@/lib/job-store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country") || undefined;

  // Read-only: never scrape here. A full scrapeAll() takes minutes, which left
  // the Stats page spinning until the request finished (and on Vercel it never
  // did — it exceeded the function timeout). An empty store now returns zeroed
  // stats immediately so the client can render its "no data yet" state and let
  // the user start a scrape explicitly.
  const stats = jobStore.getStats(country);

  return NextResponse.json(stats, {
    headers: { "Cache-Control": "no-store" },
  });
}
