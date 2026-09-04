import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { generateJobId, getCityCoordinates, normalizeCategory, normalizeCity } from "../utils";

// Adzuna supports these ME countries (2-letter codes for their API)
const COUNTRY_CONFIG: Record<string, { api_country: string; location: string }> = {
  uae: { api_country: "ae", location: "Dubai" },
  "saudi arabia": { api_country: "sa", location: "Riyadh" },
  egypt: { api_country: "eg", location: "Cairo" },
};

const HOUSEHOLD_KEYWORDS = [
  "plumber",
  "electrician",
  "contractor",
  "cleaner",
  "driver",
  "painter",
  "handyman",
  "cook chef",
  "gardener",
  "AC technician",
  "nanny babysitter",
  "security guard",
];

interface AdzunaJob {
  id: string;
  title: string;
  company?: { display_name?: string };
  location: { display_name?: string; area?: string[] };
  description: string;
  created: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  latitude?: number;
  longitude?: number;
}

export class AdzunaScraper extends BaseScraper {
  constructor() {
    super("Adzuna");
  }

  protected async performScrape(query: string, country: string): Promise<Job[]> {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) {
      console.log("[Adzuna] No ADZUNA_APP_ID/ADZUNA_APP_KEY configured — skipping");
      return [];
    }

    const config = COUNTRY_CONFIG[country.toLowerCase()];
    if (!config) {
      console.log(`[Adzuna] Country "${country}" not supported — skipping`);
      return [];
    }

    const allJobs: Job[] = [];

    if (query) {
      await this.fetchAdzunaJobs(query, config, country, appId, appKey, allJobs);
    } else {
      // Batch keywords in groups of 3 with delay to respect rate limits
      for (let i = 0; i < HOUSEHOLD_KEYWORDS.length; i += 3) {
        const batch = HOUSEHOLD_KEYWORDS.slice(i, i + 3);
        await Promise.allSettled(
          batch.map((kw) => this.fetchAdzunaJobs(kw, config, country, appId, appKey, allJobs))
        );
        if (i + 3 < HOUSEHOLD_KEYWORDS.length) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }

    return allJobs;
  }

  private async fetchAdzunaJobs(
    keywords: string,
    config: { api_country: string; location: string },
    country: string,
    appId: string,
    appKey: string,
    jobs: Job[]
  ): Promise<void> {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      what: keywords,
      where: config.location,
      results_per_page: "20",
      content_type: "application/json",
    });

    const url = `https://api.adzuna.com/v1/api/jobs/${config.api_country}/search/1?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: this.headers,
        signal: AbortSignal.timeout(12000),
      });
      const results = (await response.json())?.results as AdzunaJob[] | undefined;
      if (!Array.isArray(results)) return;

      for (const item of results) {
        if (!item.title) continue;

        const company = item.company?.display_name || "Unknown Company";
        const loc = item.location?.display_name || config.location;

        jobs.push({
          id: generateJobId(item.title, company, "adzuna"),
          title: item.title,
          company,
          location: loc,
          country,
          city: normalizeCity(loc.split(",")[0]),
          category: normalizeCategory(item.title),
          description: item.description?.substring(0, 200) || item.title,
          salary: formatAdzunaSalary(item),
          postedDate: item.created || new Date().toISOString(),
          sourceUrl: item.redirect_url || "",
          sourceName: "Adzuna",
          sourceLogo: this.getSourceLogo(),
          coordinates:
            item.latitude && item.longitude
              ? { lat: item.latitude, lng: item.longitude }
              : getCityCoordinates(loc.split(",")[0]?.trim() || ""),
          scrapedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[Adzuna] API error for "${keywords}": ${msg}`);
    }
  }
}

function formatAdzunaSalary(job: AdzunaJob): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const currency = job.salary_currency || "USD";
  if (job.salary_min && job.salary_max) {
    return `${currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`;
  }
  const amount = job.salary_min || job.salary_max;
  return `${currency} ${amount?.toLocaleString()}`;
}
