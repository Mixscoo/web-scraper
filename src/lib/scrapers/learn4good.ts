import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { extractSalary, generateJobId, getCityCoordinates, normalizeCategory } from "../utils";

const BASE_URL = "https://www.learn4good.com";
const COUNTRY_PAGES = [
  "https://www.learn4good.com/jobs/language/english/list/country/saudi_arabia/",
  "https://www.learn4good.com/jobs/language/english/list/country/saudi_arabia/more2/",
];

const SAUDI_CITY_MATCHERS: Array<{ city: string; aliases: string[] }> = [
  { city: "Riyadh", aliases: ["riyadh"] },
  { city: "Jeddah", aliases: ["jeddah"] },
  { city: "Dammam", aliases: ["dammam"] },
  { city: "Dhahran", aliases: ["dhahran"] },
  { city: "Khobar", aliases: ["khobar"] },
  { city: "Tabuk", aliases: ["tabuk"] },
  { city: "Khamis Mushait", aliases: ["khamis mushait"] },
  { city: "Şandalīyah", aliases: ["şandalīyah"] },
];

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isBroadQuery(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  return normalized.length === 0 || normalized === "household services" || normalized === "household service";
}

function matchesQuery(text: string, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) return true;

  const tokens = normalized.split(/\s+/).filter((token) => token.length > 2);
  if (tokens.length === 0) return true;

  const haystack = text.toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function detectSaudiCity(text: string): string {
  const lower = text.toLowerCase();
  for (const matcher of SAUDI_CITY_MATCHERS) {
    if (matcher.aliases.some((alias) => lower.includes(alias))) {
      return matcher.city;
    }
  }
  return "Riyadh";
}

function toAbsoluteUrl(href: string | undefined, fallback: string): string {
  if (!href) return fallback;
  if (href.startsWith("http")) return href;
  if (href.startsWith("//")) return `https:${href}`;
  return `${BASE_URL}${href}`;
}

export class Learn4GoodScraper extends BaseScraper {
  constructor() {
    super("Learn4Good", "learn4good");
  }

  protected async performScrape(query: string, country: string): Promise<Job[]> {
    if (country.toLowerCase() !== "saudi arabia") return [];

    const jobs: Job[] = [];
    const seenUrls = new Set<string>();
    const broadQuery = isBroadQuery(query);
    const urls = broadQuery ? COUNTRY_PAGES : [COUNTRY_PAGES[0]];

    await Promise.allSettled(
      urls.map((url) => this.fetchLearn4GoodPage(url, broadQuery ? "" : query.trim(), jobs, seenUrls))
    );

    return jobs;
  }

  private async fetchLearn4GoodPage(
    url: string,
    query: string,
    jobs: Job[],
    seenUrls: Set<string>
  ): Promise<void> {
    try {
      const $ = await this.fetchPage(url);

      $("td.job_cell").each((_, el) => {
        const $el = $(el);
        const title = cleanText($el.find("a.job_title").first().text()) ||
          cleanText($el.find("h2.section_name").first().text()).replace(/\s+Job$/i, "");
        const description = cleanText($el.text());

        if (!title) return;
        if (query && !matchesQuery(`${title} ${description}`, query)) return;

        const viewLink = $el.find("a.view_job_button").first().attr("href") ||
          $el.find("a.job_title").first().attr("href") ||
          "";
        const absoluteUrl = toAbsoluteUrl(viewLink, url);
        if (seenUrls.has(absoluteUrl)) return;
        seenUrls.add(absoluteUrl);

        const companyMatch = description.match(/Job Listing for:\s*([^|]+)/i);
        const company = cleanText(companyMatch?.[1] || "") || "Unknown Company";
        const locationMatch = description.match(/Job in\s+([^\n]+?)\s+(?:Education|Engineering|Finance|Healthcare|IT\/Tech|Management|Nursing|Restaurant|Retail|Sales|Position:|Job Listing for:)/i);
        const rawLocation = cleanText(locationMatch?.[1] || "");
        const city = detectSaudiCity(`${title} ${rawLocation} ${description}`);
        const location = rawLocation || `${city}, Saudi Arabia`;

        jobs.push({
          id: generateJobId(title, company, `learn4good:${absoluteUrl}`),
          title,
          company,
          location,
          country: "Saudi Arabia",
          city,
          category: normalizeCategory(title),
          description: description.slice(0, 500),
          salary: extractSalary(description),
          postedDate: new Date().toISOString(),
          sourceUrl: absoluteUrl,
          sourceName: "Learn4Good",
          sourceLogo: this.getSourceLogo(),
          coordinates: getCityCoordinates(city),
          scrapedAt: new Date().toISOString(),
        });
      });
    } catch {
      // Silently fail individual pages
    }
  }
}