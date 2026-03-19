import { NextResponse, type NextRequest } from "next/server";
import { jobStore } from "@/lib/job-store";
import { scrapeAll } from "@/lib/scrapers";

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country") || undefined;

  // Auto-scrape if the store is empty (e.g. cold start on Vercel)
  if (jobStore.size === 0) {
    try {
      await scrapeAll("household services", country || "jordan");
    } catch (e) {
      console.error("[Stats] Auto-scrape failed:", e);
    }
  }

  const stats = jobStore.getStats(country);
  return NextResponse.json(stats);
}
