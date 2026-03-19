import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import * as Papa from "papaparse";
import * as XLSX from "xlsx";
import { scrapeAll } from "@/lib/scrapers";
import { cache } from "@/lib/cache";

const exportSchema = z.object({
  format: z.enum(["csv", "xlsx", "providers"]),
  q: z.string().min(1).max(200),
  country: z.string().default("Jordan"),
  category: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = exportSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { format, q, country, category } = parsed.data;
  const cacheKey = cache.generateKey("scrape", q, country, "all");

  let jobs;
  const cached = cache.get<{ jobs: import("@/lib/types").Job[] }>(cacheKey);
  if (cached) {
    jobs = cached.data.jobs;
  } else {
    const result = await scrapeAll(q, country);
    jobs = result.jobs;
    if (category) {
      jobs = jobs.filter((j) => j.category === category);
    }
  }

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
        "Content-Disposition": `attachment; filename="providers-${country}-${q}.csv"`,
      },
    });
  }

  if (format === "csv") {
    const csv = Papa.unparse(exportData);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="jobs-${country}-${q}.csv"`,
      },
    });
  }

  // XLSX
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Jobs");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="jobs-${country}-${q}.xlsx"`,
    },
  });
}
