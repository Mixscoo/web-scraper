import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { generateJobId, getCityCoordinates, normalizeCategory, extractSalary } from "../utils";

// Tanqeeb scraper — Saudi Arabia focused
// MENA's largest job aggregator, pulling listings from agencies and company sites.
// Uses the saudi. subdomain for KSA-specific results.

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
  "دهان", "نقل أثاث", "فني تكييف",
];

const SECONDARY_CITIES = ["Jeddah", "Dammam", "Mecca", "Medina"];

const SECONDARY_KEYWORDS = [
  "cleaner", "driver", "security guard",
  "maintenance", "cook", "electrician",
];

export class TanqeebScraper extends BaseScraper {
  constructor() {
    super("Tanqeeb");
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
      await this.fetchTanqeebPage(query, "Riyadh", allJobs, seenIds);
    } else {
      const allKw = [...KEYWORDS_EN, ...KEYWORDS_AR];
      const primarySearches = allKw.map((kw) =>
        this.fetchTanqeebPage(kw, "Riyadh", allJobs, seenIds)
      );
      await Promise.allSettled(primarySearches);

      const secondarySearches = SECONDARY_CITIES.flatMap((city) =>
        SECONDARY_KEYWORDS.map((kw) =>
          this.fetchTanqeebPage(kw, city, allJobs, seenIds)
        )
      );
      await Promise.allSettled(secondarySearches);
    }

    return allJobs;
  }

  private async probeSite(keyword: string): Promise<boolean> {
    try {
      const url = `https://saudi.tanqeeb.com/en/jobs/search?keywords=${encodeURIComponent(keyword)}`;
      await this.fetchPage(url);
      return true;
    } catch {
      return false;
    }
  }

  private async fetchTanqeebPage(
    keyword: string,
    city: string,
    jobs: Job[],
    seenIds: Set<string>
  ): Promise<void> {
    const url = `https://saudi.tanqeeb.com/en/jobs/search?keywords=${encodeURIComponent(keyword)}`;

    try {
      const $ = await this.fetchPage(url);

      // Tanqeeb job listings
      $('[class*="job-item"], [class*="job-card"], .result-item, article, .listing').each((_, el) => {
        const $el = $(el);

        const title = $el.find('h2 a, h3 a, [class*="title"] a, a[href*="/job"]').first().text().trim() ||
                      $el.find('a').first().text().trim();

        const company = $el.find('[class*="company"], [class*="employer"], .comp-name').first().text().trim();

        const location = $el.find('[class*="location"], [class*="loc"]').first().text().trim();

        const link = $el.find('h2 a, h3 a, a[href*="/job"]').first().attr('href') ||
                     $el.find('a').first().attr('href') || '';

        const salary = $el.find('[class*="salary"], [class*="sal"]').first().text().trim();
        const dateText = $el.find('[class*="date"], time').first().text().trim();

        if (!title || title.length < 3) return;

        const jobId = generateJobId(title, company || "Unknown", "tanqeeb");
        if (seenIds.has(jobId)) return;
        seenIds.add(jobId);

        const detectedCity = this.detectCity(location || city);
        const absoluteUrl = link.startsWith('http') ? link : link ? `https://saudi.tanqeeb.com${link}` : url;

        jobs.push({
          id: jobId,
          title,
          company: company || "Unknown",
          location: location || `${detectedCity}, Saudi Arabia`,
          country: "Saudi Arabia",
          city: detectedCity,
          category: normalizeCategory(title),
          description: title,
          salary: extractSalary(salary) || extractSalary(title),
          postedDate: dateText || new Date().toISOString(),
          sourceUrl: absoluteUrl,
          sourceName: "Tanqeeb",
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
    return "Riyadh";
  }
}
