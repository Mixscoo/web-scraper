import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { sourceHealth } from "@/lib/source-health";
import type { SourceHealthResponse } from "@/lib/types";

export const runtime = "nodejs";

const searchSchema = z.object({
  country: z.string().default("Saudi Arabia"),
});

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = searchSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.issues },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const { country } = parsed.data;
  const sources = await sourceHealth.getCountrySummary(country);

  return NextResponse.json({
    country,
    sources,
  } satisfies SourceHealthResponse, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}