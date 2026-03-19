import { NextResponse, type NextRequest } from "next/server";
import { jobStore } from "@/lib/job-store";

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country") || undefined;
  const stats = jobStore.getStats(country);
  return NextResponse.json(stats);
}
