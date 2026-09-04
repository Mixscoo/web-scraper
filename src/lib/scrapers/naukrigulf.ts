import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { extractSalary, generateJobId, getCityCoordinates, normalizeCategory } from "../utils";

const BASE_URL = "https://www.naukrigulf.com";
const DEFAULT_KEYWORDS = [
  "driver",
  "cleaner",
  "electrician",
  "plumber",
  "technician",
  "security guard",
  "cook",
  "nurse",
];

const SAUDI_CITY_MATCHERS: Array<{ city: string; aliases: string[] }> = [
  { city: "Riyadh", aliases: ["riyadh"] },
  { city: "Jeddah", aliases: ["jeddah"] },
  { city: "Dammam", aliases: ["dammam", "eastern province"] },
  { city: "Khobar", aliases: ["khobar", "al khobar"] },
  { city: "Dhahran", aliases: ["dhahran"] },
  { city: "Mecca", aliases: ["mecca", "makkah"] },
  { city: "Medina", aliases: ["medina", "madinah"] },
  { city: "Tabuk", aliases: ["tabuk"] },
  { city: "Jubail", aliases: ["jubail"] },
  { city: "Yanbu", aliases: ["yanbu"] },
  { city: "Abha", aliases: ["abha"] },
  { city: "Najran", aliases: ["najran"] },
  { city: "Hail", aliases: ["hail", "ha'il"] },
  { city: "Khamis Mushait", aliases: ["khamis mushait"] },
];

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isBroadQuery(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  return normalized.length === 0 || normalized === "household services" || normalized === "household service";
}

function detectSaudiCity(text: string): string {
  const lower = text.toLowerCase();
  for (const matcher of SAUDI_CITY_MATCHERS) {
    if (matcher.aliases.some((alias) => lower.includes(alias))) {
      return matcher.city;
    }
  }
  // No city matched — do not guess a capital; leave it unknown.
  return "";
}

function parsePostedDate(value: string): string {
  const text = value.toLowerCase().trim();
  const now = new Date();

  const hoursMatch = text.match(/(\d+)\s*hrs?/);
  if (hoursMatch) {
    const date = new Date(now);
    date.setHours(date.getHours() - Number(hoursMatch[1]));
    return date.toISOString();
  }

  const minutesMatch = text.match(/(\d+)\s*mins?/);
  if (minutesMatch) {
    const date = new Date(now);
    date.setMinutes(date.getMinutes() - Number(minutesMatch[1]));
    return date.toISOString();
  }

  const daysMatch = text.match(/(\d+)\s*days?/);
  if (daysMatch) {
    const date = new Date(now);
    date.setDate(date.getDate() - Number(daysMatch[1]));
    return date.toISOString();
  }

  const shortDateMatch = text.match(/^(\d{1,2})\s+([a-z]{3})$/);
  if (shortDateMatch) {
    const monthIndex = MONTHS[shortDateMatch[2]];
    if (monthIndex !== undefined) {
      const date = new Date(now.getFullYear(), monthIndex, Number(shortDateMatch[1]));
      if (date.getTime() > now.getTime()) {
        date.setFullYear(date.getFullYear() - 1);
      }
      return date.toISOString();
    }
  }

  return now.toISOString();
}

function buildSearchUrl(keyword: string, page: number): string {
  const path = page > 1 ? `/jobs-in-saudi-arabia-${page}` : "/jobs-in-saudi-arabia";
  const params = new URLSearchParams({
    searchBy: "1",
    keyword,
    page: "1",
  });

  return `${BASE_URL}${path}?${params.toString()}`;
}

export class NaukriGulfScraper extends BaseScraper {
  constructor() {
    super("NaukriGulf", "naukrigulf");
  }

  protected async performScrape(query: string, country: string): Promise<Job[]> {
    if (country.toLowerCase() !== "saudi arabia") return [];

    const jobs: Job[] = [];
    const seenUrls = new Set<string>();
    const keywords = isBroadQuery(query) ? DEFAULT_KEYWORDS : [query.trim()];

    const searches = keywords.flatMap((keyword, index) => {
      const pages = index < 3 ? [1, 2] : [1];
      return pages.map((page) => this.fetchSearchPage(keyword, page, jobs, seenUrls));
    });

    await Promise.allSettled(searches);
    return jobs;
  }

  private async fetchSearchPage(
    keyword: string,
    page: number,
    jobs: Job[],
    seenUrls: Set<string>
  ): Promise<void> {
    const url = buildSearchUrl(keyword, page);

    try {
      const $ = await this.fetchPage(url);

      $("div.srp-tuple").each((_, el) => {
        const $el = $(el);
        const titleLink = $el.find('a.info-position[href*="jid-"]').first();
        const title = cleanText(titleLink.find("p.designation-title").first().text() || titleLink.text());
        const sourceUrl = titleLink.attr("href") || "";

        if (!title || !sourceUrl || seenUrls.has(sourceUrl)) return;

        const company = cleanText($el.find("a.info-org").first().text()) || "Unknown Company";
        const locationText = cleanText($el.find("li.info-loc span").last().text());
        const description = cleanText($el.find("p.description").first().text()) || title;
        const postedDateText = cleanText($el.find("span.time").first().text());
        const city = detectSaudiCity(`${locationText} ${description}`);
        const location = locationText || (city ? `${city}, Saudi Arabia` : "Saudi Arabia");

        seenUrls.add(sourceUrl);

        jobs.push({
          id: generateJobId(title, company, `naukrigulf:${sourceUrl}`),
          title,
          company,
          location,
          country: "Saudi Arabia",
          city,
          category: normalizeCategory(title),
          description: description.slice(0, 500),
          salary: extractSalary($el.text()),
          postedDate: parsePostedDate(postedDateText),
          sourceUrl,
          sourceName: "NaukriGulf",
          sourceLogo: this.getSourceLogo(),
          coordinates: getCityCoordinates(city),
          scrapedAt: new Date().toISOString(),
        });
      });
    } catch {
      // Silently fail individual search pages.
    }
  }
}