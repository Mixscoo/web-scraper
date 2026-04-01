import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { extractSalary, generateJobId, getCityCoordinates, normalizeCategory } from "../utils";

const BASE_URL = "https://sa.jobrapido.com";
const DEFAULT_KEYWORDS = [
  "driver",
  "cleaner",
  "electrician",
  "plumber",
  "cook",
  "security guard",
];

const SAUDI_CITY_MATCHERS: Array<{ city: string; aliases: string[] }> = [
  { city: "Riyadh", aliases: ["riyadh"] },
  { city: "Jeddah", aliases: ["jeddah", "jidda"] },
  { city: "Dammam", aliases: ["dammam"] },
  { city: "Khobar", aliases: ["khobar", "al khobar"] },
  { city: "Jubail", aliases: ["jubail"] },
  { city: "Mecca", aliases: ["mecca", "makkah"] },
  { city: "Medina", aliases: ["medina", "madinah"] },
  { city: "Jizan", aliases: ["jizan", "jazan", "qīzān"] },
  { city: "Yanbu", aliases: ["yanbu"] },
  { city: "Tabuk", aliases: ["tabuk"] },
  { city: "Abha", aliases: ["abha"] },
  { city: "Hofuf", aliases: ["hasa", "hofuf", "al ahsa", "al hasa"] },
];

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
  return "Riyadh";
}

function toAbsoluteUrl(href: string | undefined, fallback: string): string {
  if (!href) return fallback;
  if (href.startsWith("http")) return href;
  if (href.startsWith("//")) return `https:${href}`;
  return `${BASE_URL}${href}`;
}

export class JobrapidoScraper extends BaseScraper {
  constructor() {
    super("Jobrapido", "jobrapido");
  }

  protected async performScrape(query: string, country: string): Promise<Job[]> {
    if (country.toLowerCase() !== "saudi arabia") return [];

    const jobs: Job[] = [];
    const seenUrls = new Set<string>();
    const keywords = isBroadQuery(query) ? DEFAULT_KEYWORDS : [query.trim()];

    const searches = keywords.flatMap((keyword, index) => {
      const pages = index < 2 ? [1, 2] : [1];
      return pages.map((page) => this.fetchJobrapidoPage(keyword, page, jobs, seenUrls));
    });

    await Promise.allSettled(searches);
    return jobs;
  }

  private async fetchJobrapidoPage(
    keyword: string,
    page: number,
    jobs: Job[],
    seenUrls: Set<string>
  ): Promise<void> {
    const params = new URLSearchParams({ w: keyword });
    if (page > 1) {
      params.set("p", String(page));
    }

    const url = `${BASE_URL}/?${params.toString()}`;

    try {
      const $ = await this.fetchPage(url);

      $("div.result-item__wrapper").each((_, el) => {
        const $el = $(el);
        const previewLink = $el.find('a[href*="/jobpreview/"]').first();
        const absoluteUrl = toAbsoluteUrl(previewLink.attr("href"), url);
        if (!previewLink.length || seenUrls.has(absoluteUrl)) return;

        let title = cleanText($el.find("h2, h3").first().text());
        if (!title) {
          title = cleanText(previewLink.text())
            .replace(/^Open job preview for:\s*/i, "")
            .split(" - ")[0]
            .trim();
        }

        if (!title) return;

        const lines = $el
          .text()
          .split("\n")
          .map((line) => cleanText(line))
          .filter(Boolean)
          .filter((line) => !/^Open job preview for:/i.test(line))
          .filter((line) => !/^Want to check out your favourite jobs/i.test(line));

        const uniqueLines = Array.from(new Set(lines));
        const locationLine = uniqueLines.find((line) => line !== title && SAUDI_CITY_MATCHERS.some((matcher) => matcher.aliases.some((alias) => line.toLowerCase().includes(alias))));
        const companyLine = uniqueLines.find((line) => line !== title && line !== locationLine);
        const city = detectSaudiCity(`${locationLine || ""} ${uniqueLines.join(" ")}`);
        const location = locationLine
          ? locationLine.toLowerCase().includes("saudi")
            ? locationLine
            : `${locationLine}, Saudi Arabia`
          : `${city}, Saudi Arabia`;
        const company = companyLine || "Unknown Company";
        const description = cleanText($el.text()).slice(0, 500);

        seenUrls.add(absoluteUrl);

        jobs.push({
          id: generateJobId(title, company, `jobrapido:${absoluteUrl}`),
          title,
          company,
          location,
          country: "Saudi Arabia",
          city,
          category: normalizeCategory(title),
          description,
          salary: extractSalary(description),
          postedDate: new Date().toISOString(),
          sourceUrl: absoluteUrl,
          sourceName: "Jobrapido",
          sourceLogo: this.getSourceLogo(),
          coordinates: getCityCoordinates(city),
          scrapedAt: new Date().toISOString(),
        });
      });
    } catch {
      // Silently fail individual searches
    }
  }
}