import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { normalizeCategory, extractSalary, isMiddleEastJob } from "../utils";

const OPENSOOQ_KEYWORDS = [
  "تنظيف",       // cleaning
  "خادمة",       // maid
  "عاملة",       // worker (female)
  "شغالة",       // maid
  "سباك",       // plumber
  "نجار",       // carpenter
  "كهربائي",    // electrician
  "دهان",       // painter
  "طباخ",       // cook
  "مربية",      // babysitter
  "صيانة",      // maintenance
  "تكييف",      // HVAC
  "نقل اثاث"    // moving furniture
];

export class OpensooqScraper extends BaseScraper {
  constructor() {
    super("OpenSooq"); // Matches the "name" property
  }

  protected async performScrape(query: string, country: string): Promise<Job[]> {
    if (country.toLowerCase() !== "jordan") {
      // Right now focusing strictly on Jordan target market per business requirements
      return [];
    }

    const jobs: Job[] = [];
    const seenIds = new Set<string>();

    // We fetch a few keywords in parallel to stay fast and grab diverse fields
    const promises = OPENSOOQ_KEYWORDS.map(async (kw) => {
      const url = `https://jo.opensooq.com/en/find?term=${encodeURIComponent(kw)}`;
      try {
        const $ = await this.fetchPage(url);
        
        $('a').each((i, el) => {
          const href = $(el).attr('href');
          if (href && (href.includes('/job-posters/') || href.includes('/search/'))) {
            // Find the listing title inside the anchor
            const title = $(el).find('h2').first().text().trim();
            
            if (title && title.length > 3) {
              const fullText = $(el).text().trim().replace(/\\s+/g, ' ');
              
              // Id extraction from href
              const id = href.split('/').pop() || href;

              if (seenIds.has(id)) return;
              seenIds.add(id);

              const absoluteUrl = href.startsWith('http') ? href : `https://jo.opensooq.com${href}`;

              // Determine city from text
              let city = "Amman"; // Default based on majority volume
              const lowercaseText = fullText.toLowerCase();
              if (lowercaseText.includes("zarqa") || fullText.includes("الزرقاء")) city = "Zarqa";
              else if (lowercaseText.includes("irbid") || fullText.includes("إربد")) city = "Irbid";
              else if (lowercaseText.includes("aqaba") || fullText.includes("العقبة")) city = "Aqaba";

              // Category mapping
              const category = normalizeCategory(title);

              // Company mapping (often just individual names or "Independent Provider")
              const company = "Independent Provider"; 

              let salary = extractSalary(fullText) || extractSalary(title);

              jobs.push({
                id: `os-${id}`,
                title: title,
                company: company,
                location: `${city}, Jordan`,
                country: "Jordan",
                city: city,
                category: category,
                description: fullText.substring(0, 500),
                salary: salary,
                postedDate: new Date().toISOString(),
                sourceUrl: absoluteUrl,
                sourceName: "OpenSooq",
                sourceLogo: "/sources/opensooq.svg",
                coordinates: null,
                scrapedAt: new Date().toISOString()
              });
            }
          }
        });
      } catch (err) {
        console.error(`[OpenSooq] Error fetching keyword ${kw}:`, err instanceof Error ? err.message : err);
      }
    });

    await Promise.all(promises);

    // Keep only valid Middle East jobs that have a mapped category
    const validJobs = jobs.filter(j => isMiddleEastJob(j) && j.category !== "other");
    return validJobs;
  }
}
