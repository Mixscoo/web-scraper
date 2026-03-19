import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { generateJobId, getCityCoordinates, normalizeCategory, extractSalary } from "../utils";

// Extended LinkedIn coverage: searches page 2 with different household keyword
// combos to surface additional jobs the primary scraper misses.
// Main LinkedIn scraper uses start=0 with 12 broad keyword groups.
// This uses start=25 (page 2) with 6 specific household keyword combos.

const COUNTRY_LOCATION: Record<string, string> = {
  jordan: "Amman, Jordan",
  "saudi arabia": "Riyadh, Saudi Arabia",
  uae: "Dubai, United Arab Emirates",
  qatar: "Doha, Qatar",
  bahrain: "Manama, Bahrain",
  kuwait: "Kuwait City, Kuwait",
  oman: "Muscat, Oman",
  iraq: "Baghdad, Iraq",
  lebanon: "Beirut, Lebanon",
  egypt: "Cairo, Egypt",
};

// Secondary cities for multi-city coverage
const SECONDARY_CITIES: Record<string, string[]> = {
  jordan: ["Irbid, Jordan"],
  "saudi arabia": ["Jeddah, Saudi Arabia"],
  uae: ["Abu Dhabi, United Arab Emirates"],
};

// More specific household/service keywords (different combos than main scraper)
const HOUSEHOLD_KEYWORDS = [
  "housekeeping OR housekeeper",
  "maintenance technician OR maintenance engineer",
  "security guard OR watchman",
  "food service OR catering OR kitchen",
  "cleaning OR janitor OR steward",
  "delivery driver OR courier",
  "locksmith OR glass work",
  "carpet cleaning OR upholstery cleaning",
  "satellite OR CCTV OR solar panel",
  "renovation OR furniture OR curtain",
];

// Subset for secondary cities
const SECONDARY_KEYWORDS = [
  "housekeeping OR housekeeper",
  "maintenance OR cleaning",
  "security guard OR driver",
  "cook OR kitchen OR catering",
];

export class BaytScraper extends BaseScraper {
  constructor() {
    super("Bayt");
  }

  protected async performScrape(query: string, country: string): Promise<Job[]> {
    const countryKey = country.toLowerCase();
    const location = COUNTRY_LOCATION[countryKey];
    if (!location) return [];

    const allJobs: Job[] = [];

    if (query) {
      // Search page 1 and 2 with user query at country level
      await Promise.allSettled([
        this.fetchLinkedInPage(query, location, country, 0, allJobs),
        this.fetchLinkedInPage(query, location, country, 25, allJobs),
      ]);
    } else {
      // Primary city: household keywords, page 2 only
      const searches = HOUSEHOLD_KEYWORDS.map((kw) =>
        this.fetchLinkedInPage(kw, location, country, 25, allJobs)
      );
      await Promise.allSettled(searches);

      // Secondary cities
      const secondaryCities = SECONDARY_CITIES[countryKey] || [];
      if (secondaryCities.length > 0) {
        const secondarySearches = secondaryCities.flatMap((loc) =>
          SECONDARY_KEYWORDS.map((kw) =>
            this.fetchLinkedInPage(kw, loc, country, 25, allJobs)
          )
        );
        await Promise.allSettled(secondarySearches);
      }
    }

    return allJobs;
  }

  private async fetchLinkedInPage(
    keywords: string,
    location: string,
    country: string,
    start: number,
    jobs: Job[]
  ): Promise<void> {
    const params = new URLSearchParams();
    params.set("keywords", keywords);
    params.set("location", location);
    params.set("start", String(start));

    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params.toString()}`;

    try {
      const $ = await this.fetchPage(url);

      $("li").each((_, el) => {
        const $el = $(el);
        const title = $el.find(".base-search-card__title").first().text().trim();
        const company = $el.find(".base-search-card__subtitle a").first().text().trim() ||
                        $el.find(".base-search-card__subtitle").first().text().trim();
        const loc = $el.find(".job-search-card__location").first().text().trim();
        const date = $el.find("time").first().attr("datetime") || "";
        const link = $el.find("a.base-card__full-link").first().attr("href") ||
                     $el.find("a").first().attr("href") || "";

        if (title && company) {
          jobs.push({
            id: generateJobId(title, company, "bayt"),
            title,
            company,
            location: loc || location,
            country,
            city: loc.split(",")[0]?.trim() || "",
            category: normalizeCategory(title),
            description: title,
            salary: extractSalary(title),
            postedDate: date || new Date().toISOString(),
            sourceUrl: link.startsWith("http") ? link : `https://www.linkedin.com${link}`,
            sourceName: "Bayt",
            sourceLogo: this.getSourceLogo(),
            coordinates: getCityCoordinates(loc.split(",")[0]?.trim() || ""),
            scrapedAt: new Date().toISOString(),
          });
        }
      });
    } catch {
      // Silently fail individual page/keyword searches
    }
  }
}
