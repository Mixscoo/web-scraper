import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import * as Papa from "papaparse";
import ExcelJS from "exceljs";
import { scrapeAll } from "@/lib/scrapers";
import { cache } from "@/lib/cache";
import { resolveSourceId } from "@/lib/source-registry";
import type { Job } from "@/lib/types";

export const runtime = "nodejs";

const exportSchema = z.object({
  format: z.enum(["csv", "xlsx", "providers"]),
  q: z.string().max(200).default(""),
  country: z.string().default("Jordan"),
  categories: z.string().optional(),
  sources: z.string().optional(),
  sort: z.enum(["newest", "oldest", "company-az", "company-za"]).default("newest"),
  datePosted: z.enum(["all", "24h", "week", "month"]).default("all"),
});

function applyFilters(
  jobs: Job[],
  opts: {
    categories?: string;
    sources?: string;
    datePosted: string;
    sort: string;
  }
): Job[] {
  let filtered = jobs.filter((job) => job.category !== "other");

  if (opts.datePosted !== "all") {
    const now = Date.now();
    const cutoffs: Record<string, number> = {
      "24h": 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = cutoffs[opts.datePosted];
    if (cutoff) {
      filtered = filtered.filter((job) => now - new Date(job.postedDate).getTime() <= cutoff);
    }
  }

  if (opts.categories) {
    const categories = new Set(opts.categories.split(",").map((value) => value.trim()).filter(Boolean));
    if (categories.size > 0) {
      filtered = filtered.filter((job) => categories.has(job.category));
    }
  }

  if (opts.sources) {
    const sourceIds = new Set(opts.sources.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
    if (sourceIds.size > 0) {
      filtered = filtered.filter((job) => {
        const sourceId = resolveSourceId(job.sourceName);
        return sourceId ? sourceIds.has(sourceId) : false;
      });
    }
  }

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

function toFileToken(value: string, fallback: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = exportSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { format, q, country, categories, sources, sort, datePosted } = parsed.data;
  const cacheKey = cache.generateKey("scrape", q, country, datePosted);

  let jobs: Job[];
  const cached = cache.get<{ jobs: Job[]; sources: string[] }>(cacheKey);
  if (cached) {
    jobs = cached.data.jobs;
  } else {
    const result = await scrapeAll(q, country);
    jobs = result.jobs;
  }

  jobs = applyFilters(jobs, { categories, sources, datePosted, sort });

  const countryToken = toFileToken(country, "jobs");
  const queryToken = toFileToken(q, "all-jobs");

  const exportData = jobs.map((job) => ({
    Title: job.title,
    Company: job.company,
    Location: job.location,
    Country: job.country,
    City: job.city,
    Category: job.category,
    Salary: job.salary || "N/A",
    "Posted Date": job.postedDate,
    Source: job.sourceName,
    URL: job.sourceUrl,
    "Scraped At": job.scrapedAt,
  }));

  if (format === "providers") {
    // Group jobs by company for provider seeding
    const byCompany = new Map<string, typeof jobs>();
    for (const job of jobs) {
      const key = job.company.toLowerCase().trim();
      if (!byCompany.has(key)) byCompany.set(key, []);
      byCompany.get(key)!.push(job);
    }

    const providerData = Array.from(byCompany.values()).map((companyJobs) => {
      const categories = [...new Set(companyJobs.map((j) => j.category))];
      const cities = [...new Set(companyJobs.map((j) => j.city).filter(Boolean))];
      const salaries = companyJobs.map((j) => j.salary).filter(Boolean);
      const titles = [...new Set(companyJobs.map((j) => j.title))].slice(0, 3);
      const urls = [...new Set(companyJobs.map((j) => j.sourceUrl))].slice(0, 3);

      return {
        "Company Name": companyJobs[0].company,
        City: cities.join(", ") || "N/A",
        Categories: categories.join(", "),
        "Number of Listings": companyJobs.length,
        "Salary Range": salaries.length > 0 ? salaries.join("; ") : "N/A",
        "Sample Job Titles": titles.join("; "),
        "Source URLs": urls.join("; "),
      };
    }).sort((a, b) => b["Number of Listings"] - a["Number of Listings"]);

    const csv = Papa.unparse(providerData);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="providers-${countryToken}-${queryToken}.csv"`,
      },
    });
  }

  if (format === "csv") {
    const csv = Papa.unparse(exportData);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="jobs-${countryToken}-${queryToken}.csv"`,
      },
    });
  }

  // XLSX
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Jobs");
  if (exportData.length > 0) {
    worksheet.columns = Object.keys(exportData[0]).map((key) => ({ header: key, key }));
    for (const row of exportData) {
      worksheet.addRow(row);
    }
  }
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="jobs-${countryToken}-${queryToken}.xlsx"`,
    },
  });
}
