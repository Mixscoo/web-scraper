import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { generateJobId, getCityCoordinates, normalizeCategory, normalizeCity } from "../utils";

// Jooble API uses a single endpoint with location specifying the country/city
const COUNTRY_CONFIG: Record<string, { location: string }> = {
  jordan: { location: "Amman, Jordan" },
  "saudi arabia": { location: "Riyadh, Saudi Arabia" },
  uae: { location: "Dubai, UAE" },
  qatar: { location: "Doha, Qatar" },
  bahrain: { location: "Manama, Bahrain" },
  kuwait: { location: "Kuwait City, Kuwait" },
  oman: { location: "Muscat, Oman" },
  iraq: { location: "Baghdad, Iraq" },
  lebanon: { location: "Beirut, Lebanon" },
  egypt: { location: "Cairo, Egypt" },
};

const HOUSEHOLD_KEYWORDS = [
  "plumber",
  "electrician",
  "contractor",
  "cleaner maid",
  "driver",
  "painter",
  "handyman",
  "cook chef",
  "gardener",
  "AC technician HVAC",
  "nanny babysitter",
  "security guard",
];

interface JoobleJob {
  title: string;
  company: string;
  location: string;
  updated: string;
  link: string;
  salary: string;
  snippet: string;
}

export class JoobleScraper extends BaseScraper {
  constructor() {
    super("Jooble", "jooble");
  }

  protected async performScrape(query: string, country: string): Promise<Job[]> {
    const apiKey = process.env.JOOBLE_API_KEY;
    if (!apiKey) {
      console.log("[Jooble] No JOOBLE_API_KEY configured — skipping");
      return [];
    }

    const config = COUNTRY_CONFIG[country.toLowerCase()];
    if (!config) {
      console.log(`[Jooble] Country "${country}" not supported — skipping`);
      return [];
    }

    const allJobs: Job[] = [];

    if (query) {
      await this.fetchJoobleJobs(query, config, country, apiKey, allJobs);
    } else {
      const searches = HOUSEHOLD_KEYWORDS.map((kw) =>
        this.fetchJoobleJobs(kw, config, country, apiKey, allJobs)
      );
      await Promise.allSettled(searches);
    }

    return allJobs;
  }

  private async fetchJoobleJobs(
    keywords: string,
    config: { location: string },
    country: string,
    apiKey: string,
    jobs: Job[]
  ): Promise<void> {
    const url = `https://jooble.org/api/${apiKey}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...this.headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keywords, location: config.location }),
        signal: AbortSignal.timeout(12000),
      });

      const data = (await response.json())?.jobs as JoobleJob[] | undefined;
      if (!Array.isArray(data)) return;

      for (const item of data) {
        if (!item.title) continue;

        const company = item.company || "Unknown Company";
        const loc = item.location || config.location;

        jobs.push({
          id: generateJobId(item.title, company, "jooble"),
          title: item.title,
          company,
          location: loc,
          country,
          city: normalizeCity(loc.split(",")[0]),
          category: normalizeCategory(item.title),
          description: item.snippet?.substring(0, 200) || item.title,
          salary: item.salary || null,
          postedDate: item.updated || new Date().toISOString(),
          sourceUrl: item.link || "",
          sourceName: "Jooble",
          sourceLogo: this.getSourceLogo(),
          coordinates: getCityCoordinates(loc.split(",")[0]?.trim() || ""),
          scrapedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[Jooble] API error for "${keywords}": ${msg}`);
    }
  }
}
