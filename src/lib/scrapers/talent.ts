import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { generateJobId, getCityCoordinates, normalizeCategory, extractSalary } from "../utils";

// Country subdomains/fallbacks for talent.com
const COUNTRY_CONFIG: Record<string, { subdomain: string; location: string }> = {
  jordan: { subdomain: "www", location: "Amman, Jordan" },
  "saudi arabia": { subdomain: "sa", location: "Saudi Arabia" },
  uae: { subdomain: "ae", location: "Dubai" },
  qatar: { subdomain: "qa", location: "Qatar" },
  bahrain: { subdomain: "bh", location: "Bahrain" },
  kuwait: { subdomain: "kw", location: "Kuwait" },
  oman: { subdomain: "om", location: "Oman" },
  iraq: { subdomain: "www", location: "Baghdad, Iraq" },
  lebanon: { subdomain: "lb", location: "Lebanon" },
  egypt: { subdomain: "eg", location: "Egypt" },
};

// Countries using www subdomain need location validation (www returns US results)
const WWW_COUNTRIES = new Set(["jordan", "iraq"]);

const HOUSEHOLD_KEYWORDS = [
  "maid OR housekeeper OR cleaner",
  "driver OR chauffeur",
  "nanny OR babysitter",
  "cook OR chef",
  "gardener OR security guard",
  "plumber OR plumbing",
  "electrician OR electrical",
  "contractor OR construction",
  "painter OR handyman OR maintenance",
  "AC technician OR HVAC",
  "tiler OR welder",
  "pest control OR appliance repair",
];

export class TalentScraper extends BaseScraper {
  constructor() {
    super("Talent.com", "talent");
  }

  protected async performScrape(query: string, country: string): Promise<Job[]> {
    const config = COUNTRY_CONFIG[country.toLowerCase()];
    if (!config) return [];

    // Skip countries that use www subdomain — it returns US results
    if (WWW_COUNTRIES.has(country.toLowerCase())) {
      return [];
    }

    const allJobs: Job[] = [];

    if (query) {
      await this.fetchTalentJobs(query, config, country, allJobs);
    } else {
      // Only search household/service keywords
      const searches = HOUSEHOLD_KEYWORDS.map((kw) =>
        this.fetchTalentJobs(kw, config, country, allJobs)
      );
      await Promise.allSettled(searches);
    }

    return allJobs;
  }

  private async fetchTalentJobs(
    keywords: string,
    config: { subdomain: string; location: string },
    country: string,
    jobs: Job[]
  ): Promise<void> {
    const params = new URLSearchParams();
    params.set("k", keywords);
    params.set("l", config.location);

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
            id: generateJobId(title, company, "talent"),
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
            sourceName: "Talent.com",
            sourceLogo: this.getSourceLogo(),
            coordinates: getCityCoordinates(loc.split(",")[0]?.trim() || ""),
            scrapedAt: new Date().toISOString(),
          });
        }
      });
    } catch {
      // Silently fail individual keyword searches
    }
  }
}
