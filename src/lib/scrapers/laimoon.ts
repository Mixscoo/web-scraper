import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { generateJobId, getCityCoordinates, normalizeCategory, extractSalary } from "../utils";

const KEYWORDS_EN = [
  "cleaner", "maid", "housekeeper",
  "plumber", "carpenter", "electrician",
  "painter", "driver", "cook",
  "security guard", "babysitter", "maintenance",
  "technician", "delivery", "gardener",
];

const SECONDARY_CITIES = ["Jeddah", "Dammam", "Mecca", "Medina"];

const SECONDARY_KEYWORDS = [
  "cleaner", "driver", "security guard",
  "maintenance", "cook", "electrician",
];

// Laimoon returns quick, easy HTML results and doesn't heavily block.
export class LaimoonScraper extends BaseScraper {
  constructor() {
    super("Laimoon");
  }

  protected async performScrape(query: string, country: string): Promise<Job[]> {
    if (country.toLowerCase() !== "saudi arabia") return [];

    const allJobs: Job[] = [];
    const seenIds = new Set<string>();

    const probeKw = query || KEYWORDS_EN[0];
    const probeReachable = await this.probeSite(probeKw);
    if (!probeReachable) return [];

    if (query) {
      await this.fetchLaimoonPage(query, "Riyadh", allJobs, seenIds);
    } else {
      const primarySearches = KEYWORDS_EN.map((kw) =>
        this.fetchLaimoonPage(kw, "Riyadh", allJobs, seenIds)
      );
      await Promise.allSettled(primarySearches);

      const secondarySearches = SECONDARY_CITIES.flatMap((city) =>
        SECONDARY_KEYWORDS.map((kw) =>
          this.fetchLaimoonPage(kw, city, allJobs, seenIds)
        )
      );
      await Promise.allSettled(secondarySearches);
    }

    return allJobs;
  }

  private async probeSite(keyword: string): Promise<boolean> {
    try {
      const url = `https://jobs.laimoon.com/saudi-arabia/jobs?q=${encodeURIComponent(keyword)}`;
      await this.fetchPage(url);
      return true;
    } catch {
      return false;
    }
  }

  private async fetchLaimoonPage(
    keyword: string,
    city: string,
    jobs: Job[],
    seenIds: Set<string>
  ): Promise<void> {
    // Add city into the query for more precision, or just rely on Laimoon's generic SA search
    const url = `https://jobs.laimoon.com/saudi-arabia/jobs?q=${encodeURIComponent(keyword + " " + city)}`;

    try {
      const $ = await this.fetchPage(url);

      $('.job-row, .job-item, .item-job, div[id*="job-"]').each((_, el) => {
        const $el = $(el);

        const titleObj = $el.find('h3 a, h2 a, a.job-title, .title a').first();
        const title = titleObj.text().trim() || $el.find('h3, h2').first().text().trim();
        const link = titleObj.attr('href') || $el.find('a').first().attr('href') || '';
        
        const company = $el.find('.company, .employer, [class*="company"]').first().text().trim() || "Unknown Company";
        const locationText = $el.find('.location, .loc, [class*="location"]').first().text().trim() || "";

        if (!title || title.length < 3) return;

        const jobId = generateJobId(title, company, "laimoon");
        if (seenIds.has(jobId)) return;
        seenIds.add(jobId);

        const detectedCity = this.detectCity(locationText || city);
        const absoluteUrl = link.startsWith('http') ? link : link ? `https://jobs.laimoon.com${link}` : url;
        const allText = $el.text().replace(/\s+/g, ' ');

        jobs.push({
          id: jobId,
          title,
          company: company,
          location: detectedCity ? `${detectedCity}, Saudi Arabia` : "Saudi Arabia",
          country: "Saudi Arabia",
          city: detectedCity,
          category: normalizeCategory(title),
          description: allText.substring(0, 500),
          salary: extractSalary(allText) || null,
          postedDate: new Date().toISOString(),
          sourceUrl: absoluteUrl,
          sourceName: "Laimoon",
          sourceLogo: this.getSourceLogo(),
          coordinates: getCityCoordinates(detectedCity),
          scrapedAt: new Date().toISOString(),
        });
      });
    } catch {
      // Silently fail
    }
  }

  private detectCity(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes("jeddah") || lower.includes("جدة")) return "Jeddah";
    if (lower.includes("dammam") || lower.includes("الدمام")) return "Dammam";
    if (lower.includes("mecca") || lower.includes("makkah") || lower.includes("مكة")) return "Mecca";
    if (lower.includes("medina") || lower.includes("madinah") || lower.includes("المدينة")) return "Medina";
    if (lower.includes("khobar") || lower.includes("الخبر")) return "Khobar";
    if (lower.includes("tabuk") || lower.includes("تبوك")) return "Tabuk";
    if (lower.includes("jubail") || lower.includes("الجبيل")) return "Jubail";
    if (lower.includes("yanbu") || lower.includes("ينبع")) return "Yanbu";
    if (lower.includes("abha") || lower.includes("أبها")) return "Abha";
    // No city matched — do not guess a capital; that attributes the listing to
    // a city it may have nothing to do with. Leave it unknown.
    return "";
  }
}
