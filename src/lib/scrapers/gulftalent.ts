import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { generateJobId, getCityCoordinates, normalizeCategory, extractSalary } from "../utils";

// GulfTalent scraper — Saudi Arabia focused
// Major recruitment portal for mid-to-senior level professionals in the Gulf region.

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

export class GulfTalentScraper extends BaseScraper {
  constructor() {
    super("GulfTalent", "gulftalent");
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
      await this.fetchGulfTalentPage(query, "Riyadh", allJobs, seenIds);
    } else {
      const allKw = [...KEYWORDS_EN, ...KEYWORDS_AR];
      const primarySearches = allKw.map((kw) =>
        this.fetchGulfTalentPage(kw, "Riyadh", allJobs, seenIds)
      );
      await Promise.allSettled(primarySearches);

      const secondarySearches = SECONDARY_CITIES.flatMap((city) =>
        SECONDARY_KEYWORDS.map((kw) =>
          this.fetchGulfTalentPage(kw, city, allJobs, seenIds)
        )
      );
      await Promise.allSettled(secondarySearches);
    }

    return allJobs;
  }

  private async probeSite(keyword: string): Promise<boolean> {
    try {
      const url = `https://www.gulftalent.com/saudi-arabia/jobs?keywords=${encodeURIComponent(keyword)}`;
      await this.fetchPage(url);
      return true;
    } catch {
      return false;
    }
  }

  private async fetchGulfTalentPage(
    keyword: string,
    city: string,
    jobs: Job[],
    seenIds: Set<string>
  ): Promise<void> {
    const url = `https://www.gulftalent.com/saudi-arabia/jobs?keywords=${encodeURIComponent(keyword)}`;

    try {
      const $ = await this.fetchPage(url);

      // GulfTalent job listings
      $('.content-visibility-auto').slice(1).each((_, el) => {
        const $el = $(el);

        const titleLink = $el.find('h2 a');
        if (!titleLink.length) return;

        const title = titleLink.text().trim();
        const link = titleLink.attr('href') || '';
        
        const titleContainer = titleLink.parent().parent();
        const combinedText = titleContainer.text().replace(/\s+/g, ' ').trim();
        const companyRaw = combinedText.replace(title, '').trim();
        const company = companyRaw || "Unknown";

        const allText = $el.text().replace(/\s+/g, ' ').trim();
        // Since we don't have explicit location/salary fields inside standard class tags easily parseable, 
        // we'll rely on text regex/detection for city in `detectCity`.

        if (!title || title.length < 3) return;

        const jobId = generateJobId(title, company, "gulftalent");
        if (seenIds.has(jobId)) return;
        seenIds.add(jobId);

        const detectedCity = this.detectCity(allText || city);
        const absoluteUrl = link.startsWith('http') ? link : link ? `https://www.gulftalent.com${link}` : url;

        jobs.push({
          id: jobId,
          title,
          company: company,
          location: `${detectedCity}, Saudi Arabia`,
          country: "Saudi Arabia",
          city: detectedCity,
          category: normalizeCategory(title),
          description: allText.substring(0, 500),
          salary: extractSalary(allText),
          postedDate: new Date().toISOString(),
          sourceUrl: absoluteUrl,
          sourceName: "GulfTalent",
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
