import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { generateJobId, getCityCoordinates, normalizeCategory } from "../utils";

const COUNTRY_CONFIG: Record<string, { query_location: string; country_code: string }> = {
  jordan: { query_location: "Jordan", country_code: "JO" },
  "saudi arabia": { query_location: "Saudi Arabia", country_code: "SA" },
  uae: { query_location: "United Arab Emirates", country_code: "AE" },
  qatar: { query_location: "Qatar", country_code: "QA" },
  bahrain: { query_location: "Bahrain", country_code: "BH" },
  kuwait: { query_location: "Kuwait", country_code: "KW" },
  oman: { query_location: "Oman", country_code: "OM" },
  iraq: { query_location: "Iraq", country_code: "IQ" },
  lebanon: { query_location: "Lebanon", country_code: "LB" },
  egypt: { query_location: "Egypt", country_code: "EG" },
};

const HOUSEHOLD_KEYWORDS = [
  "maid housekeeper cleaner",
  "driver chauffeur cook chef",
  "nanny babysitter gardener",
  "plumber electrician handyman",
  "contractor painter security",
  "AC technician HVAC welder",
];

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_description: string;
  job_posted_at_datetime_utc: string;
  job_apply_link: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_latitude: number | null;
  job_longitude: number | null;
}

export class JSearchScraper extends BaseScraper {
  constructor() {
    super("JSearch");
  }

  protected async performScrape(query: string, country: string): Promise<Job[]> {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      console.log("[JSearch] No RAPIDAPI_KEY configured — skipping");
      return [];
    }
    console.log("[JSearch] API key configured, searching...");

    const config = COUNTRY_CONFIG[country.toLowerCase()];
    if (!config) return [];

    const allJobs: Job[] = [];

    if (query) {
      await this.fetchJSearchJobs(query, config, country, apiKey, allJobs);
    } else {
      // Batch keyword searches in groups of 3 to avoid free-tier rate limits
      for (let i = 0; i < HOUSEHOLD_KEYWORDS.length; i += 3) {
        const batch = HOUSEHOLD_KEYWORDS.slice(i, i + 3);
        const searches = batch.map((kw) =>
          this.fetchJSearchJobs(kw, config, country, apiKey, allJobs)
        );
        await Promise.allSettled(searches);
        if (i + 3 < HOUSEHOLD_KEYWORDS.length) {
          await this.delay(500);
        }
      }
    }

    return allJobs;
  }

  private async fetchJSearchJobs(
    keywords: string,
    config: { query_location: string; country_code: string },
    country: string,
    apiKey: string,
    jobs: Job[]
  ): Promise<void> {
    const query = `${keywords} in ${config.query_location}`;
    const params = new URLSearchParams({
      query,
      page: "1",
      num_pages: "1",
      country: config.country_code,
    });

    const url = `https://jsearch.p.rapidapi.com/search?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: {
          ...this.headers,
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
        signal: AbortSignal.timeout(15000),
      });

      const data = (await response.json())?.data as JSearchJob[] | undefined;
      if (!Array.isArray(data)) return;

      for (const item of data) {
        if (!item.job_title || !item.employer_name) continue;

        // Validate job is actually in the expected country
        if (item.job_country && item.job_country.toUpperCase() !== config.country_code) {
          continue;
        }

        const location = [item.job_city, item.job_state, item.job_country]
          .filter(Boolean)
          .join(", ");

        jobs.push({
          id: generateJobId(item.job_title, item.employer_name, "jsearch"),
          title: item.job_title,
          company: item.employer_name,
          location: location || country,
          country,
          city: item.job_city || "",
          category: normalizeCategory(item.job_title),
          description: item.job_description?.substring(0, 200) || item.job_title,
          salary: formatSalary(item),
          postedDate: item.job_posted_at_datetime_utc || new Date().toISOString(),
          sourceUrl: item.job_apply_link || "",
          sourceName: "JSearch",
          sourceLogo: this.getSourceLogo(),
          coordinates:
            item.job_latitude && item.job_longitude
              ? { lat: item.job_latitude, lng: item.job_longitude }
              : getCityCoordinates(item.job_city || ""),
          scrapedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[JSearch] API error for "${keywords}": ${msg}`);
    }
  }
}

function formatSalary(job: JSearchJob): string | null {
  if (!job.job_min_salary && !job.job_max_salary) return null;
  const currency = job.job_salary_currency || "USD";
  if (job.job_min_salary && job.job_max_salary) {
    return `${currency} ${job.job_min_salary.toLocaleString()} - ${job.job_max_salary.toLocaleString()}`;
  }
  const amount = job.job_min_salary || job.job_max_salary;
  return `${currency} ${amount?.toLocaleString()}`;
}
