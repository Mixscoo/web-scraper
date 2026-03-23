import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { scrapeAll } from "@/lib/scrapers";
import { cache } from "@/lib/cache";
import { ITEMS_PER_PAGE, CATEGORY_IDS, SOURCES } from "@/lib/constants";
import type { ApiResponse, Job } from "@/lib/types";

const searchSchema = z.object({
  q: z.string().max(200).default(""),
  country: z.string().default("Jordan"),
  categories: z.string().optional(),       // comma-separated category IDs
  sources: z.string().optional(),           // comma-separated source names
  sort: z.enum(["newest", "oldest", "company-az", "company-za"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  datePosted: z.enum(["all", "24h", "week", "month"]).default("all"),
});

function applyFilters(
  jobs: Job[],
  opts: {
    datePosted: string;
    categories?: string;
    sources?: string;
    sort: string;
  }
): Job[] {
  // Always filter out completely unidentifiable garbage ("other")
  let filtered = jobs.filter((j) => j.category !== "other");

  // Date filter
  if (opts.datePosted !== "all") {
    const now = Date.now();
    const cutoffs: Record<string, number> = {
      "24h": 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = cutoffs[opts.datePosted];
    if (cutoff) {
      filtered = filtered.filter((job) => {
        const jobDate = new Date(job.postedDate).getTime();
        return now - jobDate <= cutoff;
      });
    }
  }

  // Category filter
  if (opts.categories) {
    const catSet = new Set(opts.categories.split(",").map((c) => c.trim()).filter(Boolean));
    if (catSet.size > 0) {
      filtered = filtered.filter((j) => catSet.has(j.category));
    }
  }

  // Source filter — UI sends source IDs, we need to match against sourceName
  if (opts.sources) {
    const sourceIds = new Set(opts.sources.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
    // Map source IDs to source names
    const sourceNames = new Set(
      SOURCES.filter((s) => sourceIds.has(s.id)).map((s) => s.name.toLowerCase())
    );
    if (sourceNames.size > 0) {
      filtered = filtered.filter((j) => sourceNames.has(j.sourceName.toLowerCase()));
    }
  }

  // Sort
  filtered.sort((a, b) => {
    switch (opts.sort) {
      case "oldest":
        return new Date(a.postedDate).getTime() - new Date(b.postedDate).getTime();
      case "company-az":
        return a.company.localeCompare(b.company);
      case "company-za":
        return b.company.localeCompare(a.company);
      case "newest":
      default:
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
    }
  });

  return filtered;
}

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);

  const parsed = searchSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { q, country, categories, sources, sort, page, datePosted } = parsed.data;

  // Cache key includes all filter params
  const cacheKey = cache.generateKey("scrape", q, country, datePosted);

  // Check cache for raw scraped data
  const cached = cache.get<{ jobs: Job[]; sources: string[] }>(cacheKey);
  if (cached) {
    const filtered = applyFilters(cached.data.jobs, { datePosted, categories, sources, sort });
    const activeSources = [...new Set(filtered.map((j) => j.sourceName))];
    const start = (page - 1) * ITEMS_PER_PAGE;
    const paginatedJobs = filtered.slice(start, start + ITEMS_PER_PAGE);
    return NextResponse.json({
      jobs: paginatedJobs,
      total: filtered.length,
      sources: activeSources,
      cachedAt: cached.cachedAt,
      page,
      totalPages: Math.ceil(filtered.length / ITEMS_PER_PAGE),
    } satisfies ApiResponse);
  }

  try {
    const { jobs, results } = await scrapeAll(q, country);
    const scraperSources = results.filter((r) => r.success).map((r) => r.source);

    // Cache the raw unfiltered results so filters can be applied cheaply
    cache.set(cacheKey, { jobs, sources: scraperSources });

    // Apply all filters + sort
    const filtered = applyFilters(jobs, { datePosted, categories, sources, sort });
    const activeSources = [...new Set(filtered.map((j) => j.sourceName))];

    // Paginate
    const start = (page - 1) * ITEMS_PER_PAGE;
    const paginatedJobs = filtered.slice(start, start + ITEMS_PER_PAGE);

    return NextResponse.json({
      jobs: paginatedJobs,
      total: filtered.length,
      sources: activeSources,
      cachedAt: null,
      page,
      totalPages: Math.ceil(filtered.length / ITEMS_PER_PAGE),
    } satisfies ApiResponse);
  } catch (error) {
    console.error("[API /scrape] Error:", error);
    return NextResponse.json(
      { error: "Failed to scrape jobs. Please try again." },
      { status: 500 }
    );
  }
}
