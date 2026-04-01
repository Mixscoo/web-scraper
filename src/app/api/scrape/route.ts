import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { scrapeAll } from "@/lib/scrapers";
import { cache } from "@/lib/cache";
import { ITEMS_PER_PAGE, CATEGORIES, CATEGORY_IDS, SOURCES } from "@/lib/constants";
import { getSourceById, resolveSourceId } from "@/lib/source-registry";
import { sourceHealth } from "@/lib/source-health";
import type { ApiResponse, Job } from "@/lib/types";

export const runtime = "nodejs";

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
    if (sourceIds.size > 0) {
      filtered = filtered.filter((j) => {
        const sourceId = resolveSourceId(j.sourceName);
        return sourceId ? sourceIds.has(sourceId) : false;
      });
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

function getActiveSourceNames(jobs: Job[]): string[] {
  return Array.from(
    new Set(
      jobs.map((job) => {
        const sourceId = resolveSourceId(job.sourceName);
        return getSourceById(sourceId)?.name ?? job.sourceName;
      })
    )
  );
}

function formatCategoryName(slug: string): string {
  if (!slug || slug === "other") return "Other";
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const forceFresh = request.nextUrl.searchParams.get("force") === "1";
  const responseInit = {
    headers: {
      "Cache-Control": "no-store",
    },
  };

  const parsed = searchSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.issues },
      { status: 400, ...responseInit }
    );
  }

  const { q, country, categories, sources, sort, page, datePosted } = parsed.data;

  // Cache key includes all filter params
  const cacheKey = cache.generateKey("scrape", q, country, datePosted);

  // Check cache for raw scraped data
  const cached = forceFresh ? null : cache.get<{ jobs: Job[]; sources: string[] }>(cacheKey);
  if (cached) {
    const rawJobs = cached.data.jobs;
    const sourceHealthSummary = await sourceHealth.getCountrySummary(country);
    // Extract dynamically available categories from ALL raw jobs, skipping "other"
    const uniqueRawCategories = [...new Set(rawJobs.map(j => j.category).filter(c => c !== "other"))];
    const availableCategories = uniqueRawCategories.map(c => ({
      id: c,
      name: CATEGORY_IDS.includes(c as any) ? (CATEGORIES.find(cat => cat.id === c)?.name || formatCategoryName(c)) : formatCategoryName(c)
    }));

    const filtered = applyFilters(rawJobs, { datePosted, categories, sources, sort });
    const activeSources = getActiveSourceNames(filtered);
    const start = (page - 1) * ITEMS_PER_PAGE;
    const paginatedJobs = filtered.slice(start, start + ITEMS_PER_PAGE);
    return NextResponse.json({
      jobs: paginatedJobs,
      total: filtered.length,
      availableCategories,
      sourceHealth: sourceHealthSummary,
      sources: activeSources,
      cachedAt: cached.cachedAt,
      liveScrapedAt: cached.cachedAt,
      page,
      totalPages: Math.ceil(filtered.length / ITEMS_PER_PAGE),
    } satisfies ApiResponse, responseInit);
  }

  try {
    const { jobs, results } = await scrapeAll(q, country);
    const sourceHealthSummary = await sourceHealth.getCountrySummary(country);
    const scraperSources = results.filter((r) => r.success).map((r) => r.sourceName);
    const liveScrapedAt = new Date().toISOString();

    // Cache the raw unfiltered results so filters can be applied cheaply
    cache.set(cacheKey, { jobs, sources: scraperSources });

    const uniqueRawCategories = [...new Set(jobs.map(j => j.category).filter(c => c !== "other"))];
    const availableCategories = uniqueRawCategories.map(c => ({
      id: c,
      name: CATEGORY_IDS.includes(c as any) ? (CATEGORIES.find(cat => cat.id === c)?.name || formatCategoryName(c)) : formatCategoryName(c)
    }));

    // Apply all filters + sort
    const filtered = applyFilters(jobs, { datePosted, categories, sources, sort });
  const activeSources = getActiveSourceNames(filtered);

    // Paginate
    const start = (page - 1) * ITEMS_PER_PAGE;
    const paginatedJobs = filtered.slice(start, start + ITEMS_PER_PAGE);

    return NextResponse.json({
      jobs: paginatedJobs,
      total: filtered.length,
      availableCategories,
      sourceHealth: sourceHealthSummary,
      sources: activeSources,
      cachedAt: null,
      liveScrapedAt,
      page,
      totalPages: Math.ceil(filtered.length / ITEMS_PER_PAGE),
    } satisfies ApiResponse, responseInit);
  } catch (error) {
    console.error("[API /scrape] Error:", error);
    return NextResponse.json(
      { error: "Failed to scrape jobs. Please try again." },
      { status: 500, ...responseInit }
    );
  }
}
