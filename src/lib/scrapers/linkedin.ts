import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { generateJobId, getCityCoordinates, normalizeCategory, extractSalary } from "../utils";

const COUNTRY_MAP: Record<string, { name: string; location: string }> = {
  jordan: { name: "Jordan", location: "Amman, Jordan" },
  "saudi arabia": { name: "Saudi Arabia", location: "Riyadh, Saudi Arabia" },
  uae: { name: "United Arab Emirates", location: "Dubai, United Arab Emirates" },
  qatar: { name: "Qatar", location: "Doha, Qatar" },
  bahrain: { name: "Bahrain", location: "Manama, Bahrain" },
  kuwait: { name: "Kuwait", location: "Kuwait City, Kuwait" },
  oman: { name: "Oman", location: "Muscat, Oman" },
  iraq: { name: "Iraq", location: "Baghdad, Iraq" },
  lebanon: { name: "Lebanon", location: "Beirut, Lebanon" },
  egypt: { name: "Egypt", location: "Cairo, Egypt" },
};

// Secondary cities for multi-city scraping (searched with top keywords only)
const SECONDARY_CITIES: Record<string, string[]> = {
  jordan: ["Irbid, Jordan", "Zarqa, Jordan", "Aqaba, Jordan"],
  iraq: ["Erbil, Iraq"],
  egypt: ["Alexandria, Egypt"],
  "saudi arabia": ["Jeddah, Saudi Arabia", "Dammam, Saudi Arabia"],
  uae: ["Abu Dhabi, United Arab Emirates", "Sharjah, United Arab Emirates"],
};

// Top keywords used for secondary city searches (subset to limit request count)
const SECONDARY_KEYWORDS = [
  "maid OR housekeeper OR cleaner",
  "driver OR chauffeur OR cook",
  "plumber OR electrician OR handyman",
  "security guard OR maintenance",
  "nanny OR babysitter",
  "carpenter OR painter",
];

// Household/service keywords to search when no specific query is provided
const HOUSEHOLD_KEYWORDS = [
  "maid OR housekeeper OR cleaner",
  "driver OR chauffeur",
  "nanny OR babysitter OR childcare",
  "cook OR chef",
  "gardener OR security guard",
  "plumber OR plumbing",
  "electrician OR electrical technician",
  "contractor OR construction worker",
  "painter OR handyman OR maintenance",
  "AC technician OR HVAC OR air conditioning",
  "tiler OR welder OR fabricator",
  "pest control OR appliance repair",
  "locksmith OR glass worker OR glazier",
  "car wash OR upholstery cleaning OR carpet cleaning",
  "satellite installation OR solar panel OR CCTV installation",
  "curtain installation OR furniture assembly OR home renovation",
  "delivery OR courier OR errands",
];

// Arabic keywords for Jordan (captures Arabic-language job postings)
const ARABIC_KEYWORDS = [
  "\u0639\u0627\u0645\u0644 \u0646\u0638\u0627\u0641\u0629 OR \u062e\u0627\u062f\u0645\u0629",
  "\u0633\u0627\u0626\u0642 OR \u0637\u0628\u0627\u062e",
  "\u0646\u062c\u0651\u0627\u0631 OR \u0633\u0628\u0627\u0643 OR \u0643\u0647\u0631\u0628\u0627\u0626\u064a",
  "\u062d\u0627\u0631\u0633 \u0623\u0645\u0646 OR \u0628\u0633\u062a\u0627\u0646\u064a",
];

export class LinkedInScraper extends BaseScraper {
  constructor() {
    super("LinkedIn");
  }

  protected async performScrape(query: string, country: string): Promise<Job[]> {
    const config = COUNTRY_MAP[country.toLowerCase()] || COUNTRY_MAP["jordan"];
    const allJobs: Job[] = [];
    const countryKey = country.toLowerCase();

    if (query) {
      // User provided a keyword — search just that in primary city
      await this.fetchLinkedInJobs(query, config, country, allJobs);
      // Also search secondary cities
      const secondaryCities = SECONDARY_CITIES[countryKey] || [];
      if (secondaryCities.length > 0) {
        await Promise.allSettled(
          secondaryCities.map((loc) =>
            this.fetchLinkedInJobs(query, { name: config.name, location: loc }, country, allJobs, 25)
          )
        );
      }
    } else {
      // Primary city: full household keywords + Arabic keywords
      const primarySearches = HOUSEHOLD_KEYWORDS.map((kw) =>
        this.fetchLinkedInJobs(kw, config, country, allJobs, 25)
      );

      // Arabic keywords (for countries with Arabic job postings)
      if (["jordan", "iraq", "egypt", "saudi arabia", "uae", "kuwait", "qatar", "bahrain", "oman", "lebanon"].includes(countryKey)) {
        primarySearches.push(
          ...ARABIC_KEYWORDS.map((kw) =>
            this.fetchLinkedInJobs(kw, config, country, allJobs, 25)
          )
        );
      }

      await Promise.allSettled(primarySearches);

      // Secondary cities: top keywords only
      const secondaryCities = SECONDARY_CITIES[countryKey] || [];
      if (secondaryCities.length > 0) {
        const secondarySearches = secondaryCities.flatMap((loc) =>
          SECONDARY_KEYWORDS.map((kw) =>
            this.fetchLinkedInJobs(kw, { name: config.name, location: loc }, country, allJobs, 25)
          )
        );
        await Promise.allSettled(secondarySearches);
      }
    }

    return allJobs;
  }

  private async fetchLinkedInJobs(
    keywords: string,
    config: { name: string; location: string },
    country: string,
    jobs: Job[],
    maxResults = 50
  ): Promise<void> {
    for (let start = 0; start < maxResults; start += 25) {
      const params = new URLSearchParams();
      if (keywords) params.set("keywords", keywords);
      params.set("location", config.location);
      params.set("start", String(start));

      const searchUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params.toString()}`;

      try {
        const $ = await this.fetchPage(searchUrl);

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
              id: generateJobId(title, company, "linkedin"),
              title,
              company,
              location: loc || config.name,
              country,
              city: loc.split(",")[0]?.trim() || "",
              category: normalizeCategory(title),
              description: title,
              salary: extractSalary(title),
              postedDate: date || new Date().toISOString(),
              sourceUrl: link.startsWith("http") ? link : `https://www.linkedin.com${link}`,
              sourceName: "LinkedIn Jobs",
              sourceLogo: this.getSourceLogo(),
              coordinates: getCityCoordinates(loc),
              scrapedAt: new Date().toISOString(),
            });
          }
        });
      } catch {
        if (start > 0) break;
        // Silently fail individual keyword searches
      }
    }
  }
}
