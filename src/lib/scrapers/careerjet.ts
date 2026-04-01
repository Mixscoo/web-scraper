import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { generateJobId, getCityCoordinates, normalizeCategory, extractSalary } from "../utils";

// Extended coverage: fetches page 2 from Talent.com (for countries with subdomains)
// or LinkedIn page 2 at country level (for countries without Talent.com subdomains)
const TALENT_CONFIG: Record<string, { subdomain: string; location: string }> = {
  "saudi arabia": { subdomain: "sa", location: "Saudi Arabia" },
  uae: { subdomain: "ae", location: "Dubai" },
  qatar: { subdomain: "qa", location: "Qatar" },
  bahrain: { subdomain: "bh", location: "Bahrain" },
  kuwait: { subdomain: "kw", location: "Kuwait" },
  oman: { subdomain: "om", location: "Oman" },
  lebanon: { subdomain: "lb", location: "Lebanon" },
  egypt: { subdomain: "eg", location: "Egypt" },
};

// Countries that fall back to LinkedIn page 2 (no Talent.com subdomain)
const LINKEDIN_FALLBACK: Record<string, string> = {
  jordan: "Amman, Jordan",
  iraq: "Baghdad, Iraq",
};

// Secondary cities for LinkedIn fallback countries
const LINKEDIN_SECONDARY: Record<string, string[]> = {
  jordan: ["Irbid, Jordan", "Zarqa, Jordan"],
  iraq: ["Erbil, Iraq"],
};

const HOUSEHOLD_KEYWORDS = [
  "plumber",
  "electrician",
  "cleaner",
  "driver",
  "cook",
  "contractor",
  "locksmith",
  "carpet cleaning",
  "satellite installation",
  "renovation",
];

// Subset for secondary cities
const SECONDARY_KEYWORDS = [
  "cleaner",
  "driver",
  "plumber",
  "cook",
];

export class GrabJobsScraper extends BaseScraper {
  constructor() {
    super("GrabJobs", "grabjobs");
  }

  protected async performScrape(query: string, country: string): Promise<Job[]> {
    const countryKey = country.toLowerCase();
    const allJobs: Job[] = [];

    // Use Talent.com for countries with dedicated subdomains
    const talentConfig = TALENT_CONFIG[countryKey];
    if (talentConfig) {
      if (query) {
        await this.fetchTalentPage(query, talentConfig, country, allJobs);
      } else {
        await Promise.allSettled(
          HOUSEHOLD_KEYWORDS.map((kw) => this.fetchTalentPage(kw, talentConfig, country, allJobs))
        );
      }
      return allJobs;
    }

    // Fallback to LinkedIn page 2 country-level for Jordan, Iraq, etc.
    const linkedinLocation = LINKEDIN_FALLBACK[countryKey];
    if (linkedinLocation) {
      if (query) {
        await this.fetchLinkedInPage(query, linkedinLocation, country, 25, allJobs);
      } else {
        // Primary city
        await Promise.allSettled(
          HOUSEHOLD_KEYWORDS.map((kw) => this.fetchLinkedInPage(kw, linkedinLocation, country, 25, allJobs))
        );
        // Secondary cities
        const secondaryCities = LINKEDIN_SECONDARY[countryKey] || [];
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

    return [];
  }

  private async fetchTalentPage(
    keywords: string,
    config: { subdomain: string; location: string },
    country: string,
    jobs: Job[]
  ): Promise<void> {
    const params = new URLSearchParams();
    params.set("k", keywords);
    params.set("l", config.location);
    params.set("p", "2");

    const url = `https://${config.subdomain}.talent.com/jobs?${params.toString()}`;

    try {
      const $ = await this.fetchPage(url);

      $("article").each((_, el) => {
        const $el = $(el);
        const title = $el.find("h2").first().text().trim();
        const headerPs = $el.find("header p");
        const company = headerPs.eq(0).text().trim();
        const loc = headerPs.eq(1).text().trim();
        const href = $el.find("a[href*='/view']").first().attr("href") || "";

        if (title && company) {
          const fullUrl = href.startsWith("http")
            ? href
            : `https://${config.subdomain}.talent.com${href}`;

          jobs.push({
            id: generateJobId(title, company, "talent-ext"),
            title,
            company,
            location: loc || country,
            country,
            city: loc.split(",")[0]?.trim() || "",
            category: normalizeCategory(title),
            description: title,
            salary: extractSalary(title),
            postedDate: new Date().toISOString(),
            sourceUrl: fullUrl,
            sourceName: "GrabJobs",
            sourceLogo: this.getSourceLogo(),
            coordinates: getCityCoordinates(loc.split(",")[0]?.trim() || ""),
            scrapedAt: new Date().toISOString(),
          });
        }
      });
    } catch {
      // Silently fail
    }
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
            id: generateJobId(title, company, "grabjobs"),
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
            sourceName: "GrabJobs",
            sourceLogo: this.getSourceLogo(),
            coordinates: getCityCoordinates(loc.split(",")[0]?.trim() || ""),
            scrapedAt: new Date().toISOString(),
          });
        }
      });
    } catch {
      // Silently fail
    }
  }
}
