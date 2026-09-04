import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { generateJobId, getCityCoordinates, normalizeCategory, extractSalary } from "../utils";

// Real Bayt.com scraper — Saudi Arabia focused
// Bayt is the leading job portal in the Middle East with massive KSA coverage.

const KEYWORDS_EN = [
  "cleaner", "maid", "housekeeper",
  "plumber", "carpenter", "electrician",
  "painter", "driver", "cook",
  "security guard", "babysitter", "maintenance",
  "technician", "delivery", "gardener",
];

const KEYWORDS_AR = [
  "عامل نظافة", "سباك", "نجار",
  "كهربائي", "سائق", "طباخ",
  "حارس أمن", "مربية أطفال", "فني صيانة",
  "فني تكييف", "نقل أثاث", "دهان",
];

const SECONDARY_CITIES = ["Jeddah", "Dammam", "Mecca", "Medina"];

const SECONDARY_KEYWORDS = [
  "cleaner", "driver", "security guard",
  "maintenance", "cook", "electrician",
];

export class BaytScraper extends BaseScraper {
  constructor() {
    super("Bayt");
  }

  protected async performScrape(query: string, country: string): Promise<Job[]> {
    if (country.toLowerCase() !== "saudi arabia") return [];

    const allJobs: Job[] = [];
    const seenIds = new Set<string>();

    // Probe: test one keyword first to see if the site is reachable
    const probeKw = query || KEYWORDS_EN[0];
    const probeReachable = await this.probeSite(probeKw);
    if (!probeReachable) return [];

    if (query) {
      await this.fetchBaytPage(query, "Saudi Arabia", "Riyadh", allJobs, seenIds);
    } else {
      // Primary: Riyadh with all keywords
      const allKw = [...KEYWORDS_EN, ...KEYWORDS_AR];
      const primarySearches = allKw.map((kw) =>
        this.fetchBaytPage(kw, "Saudi Arabia", "Riyadh", allJobs, seenIds)
      );
      await Promise.allSettled(primarySearches);

      // Secondary cities with keyword subset
      const secondarySearches = SECONDARY_CITIES.flatMap((city) =>
        SECONDARY_KEYWORDS.map((kw) =>
          this.fetchBaytPage(kw, "Saudi Arabia", city, allJobs, seenIds)
        )
      );
      await Promise.allSettled(secondarySearches);
    }

    return allJobs;
  }

  private async probeSite(keyword: string): Promise<boolean> {
    try {
      const url = `https://www.bayt.com/en/saudi-arabia/jobs/?keyword=${encodeURIComponent(keyword)}&page=1`;
      await this.fetchPage(url);
      return true;
    } catch {
      return false;
    }
  }

  private async fetchBaytPage(
    keyword: string,
    country: string,
    city: string,
    jobs: Job[],
    seenIds: Set<string>
  ): Promise<void> {
    const url = `https://www.bayt.com/en/saudi-arabia/jobs/?keyword=${encodeURIComponent(keyword)}&page=1`;

    try {
      const $ = await this.fetchPage(url);

      // Bayt job listings use <li> elements with job card structure
      $('[data-job-id], .has-icon-after, li[data-js-job]').each((_, el) => {
        const $el = $(el);

        const title = $el.find('h2 a, .jb-title, [data-js-job-title]').first().text().trim() ||
                      $el.find('a[href*="/job/"]').first().text().trim();

        const company = $el.find('.t-mute a, .jb-company, [data-js-company]').first().text().trim() ||
                        $el.find('.t-small a').first().text().trim();

        const location = $el.find('.t-mute .loc, [data-js-location]').first().text().trim() ||
                         $el.find('.t-small').last().text().trim();

        const link = $el.find('h2 a, a[href*="/job/"]').first().attr('href') || '';
        const dateText = $el.find('time, .date, [datetime]').first().attr('datetime') ||
                         $el.find('time, .date').first().text().trim();

        if (!title || title.length < 3) return;

        const jobId = generateJobId(title, company || "Unknown", "bayt");
        if (seenIds.has(jobId)) return;
        seenIds.add(jobId);

        const detectedCity = this.detectCity(location || city);
        const absoluteUrl = link.startsWith('http') ? link : link ? `https://www.bayt.com${link}` : url;

        jobs.push({
          id: jobId,
          title,
          company: company || "Unknown",
          location: location || (detectedCity ? `${detectedCity}, Saudi Arabia` : "Saudi Arabia"),
          country: "Saudi Arabia",
          city: detectedCity,
          category: normalizeCategory(title),
          description: title,
          salary: extractSalary($el.text()),
          postedDate: dateText || new Date().toISOString(),
          sourceUrl: absoluteUrl,
          sourceName: "Bayt",
          sourceLogo: this.getSourceLogo(),
          coordinates: getCityCoordinates(detectedCity),
          scrapedAt: new Date().toISOString(),
        });
      });
    } catch {
      // Silently fail individual keyword searches
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
