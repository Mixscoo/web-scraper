import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { generateJobId, getCityCoordinates, normalizeCategory, extractSalary } from "../utils";

const BASE_URL = "https://www.expatriates.com";

interface CountryConfig {
  country: string;
  defaultCity: string;
  basePath: string;
  listPaths: string[];
  cityMatchers: Array<{ city: string; aliases: string[] }>;
}

const COUNTRY_CONFIG: Record<string, CountryConfig> = {
  "saudi arabia": {
    country: "Saudi Arabia",
    defaultCity: "Riyadh",
    basePath: "/classifieds/saudi-arabia/jobs/",
    listPaths: [
      "/classifieds/saudi-arabia/jobs/index.html",
      "/classifieds/saudi-arabia/jobs/index100.html",
    ],
    cityMatchers: [
      { city: "Riyadh", aliases: ["riyadh", "ksa"] },
      { city: "Jeddah", aliases: ["jeddah"] },
      { city: "Dammam", aliases: ["dammam", "eastern province"] },
      { city: "Khobar", aliases: ["khobar", "al khobar"] },
      { city: "Jubail", aliases: ["jubail"] },
      { city: "Mecca", aliases: ["mecca", "makkah"] },
      { city: "Medina", aliases: ["medina", "madinah"] },
      { city: "Yanbu", aliases: ["yanbu"] },
      { city: "Tabuk", aliases: ["tabuk"] },
      { city: "Jizan", aliases: ["jizan", "jazan"] },
      { city: "Abha", aliases: ["abha"] },
      { city: "Buraidah", aliases: ["buraidah", "buraydah", "qassim"] },
      { city: "Al Kharj", aliases: ["al kharj", "kharj"] },
      { city: "Ras Tanura", aliases: ["ras tanura"] },
    ],
  },
  uae: {
    country: "UAE",
    defaultCity: "Dubai",
    basePath: "/classifieds/uae/jobs/",
    listPaths: [
      "/classifieds/uae/jobs/index.html",
      "/classifieds/uae/jobs/index100.html",
    ],
    cityMatchers: [
      { city: "Dubai", aliases: ["dubai"] },
      { city: "Abu Dhabi", aliases: ["abu dhabi"] },
      { city: "Sharjah", aliases: ["sharjah"] },
      { city: "Ajman", aliases: ["ajman"] },
      { city: "Al Ain", aliases: ["al ain"] },
      { city: "Fujairah", aliases: ["fujairah"] },
      { city: "Ras Al Khaimah", aliases: ["ras al khaimah", "ras al khaymah"] },
      { city: "Umm Al Quwain", aliases: ["umm al quwain", "umm al qaywayn", "umm al qawain"] },
    ],
  },
};

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isBroadQuery(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  return normalized.length === 0 || normalized === "household services" || normalized === "household service";
}

function toAbsoluteUrl(href: string | undefined, fallback: string): string {
  if (!href) return fallback;
  if (href.startsWith("http")) return href;
  return `${BASE_URL}${href}`;
}

function detectCity(config: CountryConfig, text: string): string {
  const lower = text.toLowerCase();
  for (const matcher of config.cityMatchers) {
    if (matcher.aliases.some((alias) => lower.includes(alias))) {
      return matcher.city;
    }
  }
  return config.defaultCity;
}

export class ExpatriatesScraper extends BaseScraper {
  constructor() {
    super("Expatriates", "expatriates");
  }

  protected async performScrape(query: string, country: string): Promise<Job[]> {
    const config = COUNTRY_CONFIG[country.toLowerCase()];
    if (!config) return [];

    const allJobs: Job[] = [];
    const seenIds = new Set<string>();

    const urls = isBroadQuery(query)
      ? config.listPaths.map((path) => `${BASE_URL}${path}`)
      : [`${BASE_URL}${config.basePath}?search=${encodeURIComponent(query.trim())}`];

    await Promise.allSettled(
      urls.map((url) => this.fetchExpatriatesPage(config, url, allJobs, seenIds))
    );

    return allJobs;
  }

  private async fetchExpatriatesPage(
    config: CountryConfig,
    url: string,
    jobs: Job[],
    seenIds: Set<string>
  ): Promise<void> {
    try {
      const $ = await this.fetchPage(url);

      $("li").each((_, el) => {
        const $el = $(el);

        const titleLink = $el.find('a[href*="/cls/"]').first();
        const title = cleanText(titleLink.text()) || cleanText($el.find("img[alt]").first().attr("alt") || "");
        const link = titleLink.attr("href") || "";
        const rawText = cleanText($el.text());
        const locationText = cleanText($el.find('a[href*="/classifieds/"]').last().text());

        if (!title || title.length < 3) return;
        if (!link) return;

        const absoluteUrl = toAbsoluteUrl(link, url);
        if (seenIds.has(absoluteUrl)) return;
        seenIds.add(absoluteUrl);

        const detectedCity = detectCity(config, `${locationText} ${rawText}`);
        const company = "Independent Employer";
        const jobId = generateJobId(title, company, `expatriates:${absoluteUrl}`);
        const location = locationText
          ? locationText.toLowerCase().includes(config.country.toLowerCase())
            ? locationText
            : `${locationText}, ${config.country}`
          : `${detectedCity}, ${config.country}`;

        jobs.push({
          id: jobId,
          title,
          company,
          location,
          country: config.country,
          city: detectedCity,
          category: normalizeCategory(title),
          description: rawText.slice(0, 500),
          salary: extractSalary(rawText),
          postedDate: new Date().toISOString(),
          sourceUrl: absoluteUrl,
          sourceName: "Expatriates",
          sourceLogo: this.getSourceLogo(),
          coordinates: getCityCoordinates(detectedCity),
          scrapedAt: new Date().toISOString(),
        });
      });
    } catch {
      // Silently fail individual pages
    }
  }
}
