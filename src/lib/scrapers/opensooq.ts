import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { normalizeCategory, extractSalary, isMiddleEastJob } from "../utils";

interface CountryConfig {
  country: string;
  baseUrl: string;
  defaultCity: string;
  keywords: string[];
  cityMatchers: Array<{ city: string; aliases: string[] }>;
}

const COUNTRY_CONFIG: Record<string, CountryConfig> = {
  jordan: {
    country: "Jordan",
    baseUrl: "https://jo.opensooq.com",
    defaultCity: "Amman",
    keywords: [
      "تنظيف",
      "خادمة",
      "عاملة",
      "شغالة",
      "سباك",
      "نجار",
      "كهربائي",
      "دهان",
      "طباخ",
      "مربية",
      "صيانة",
      "تكييف",
      "نقل اثاث",
    ],
    cityMatchers: [
      { city: "Amman", aliases: ["amman", "عمان"] },
      { city: "Zarqa", aliases: ["zarqa", "الزرقاء"] },
      { city: "Irbid", aliases: ["irbid", "إربد", "اربد"] },
      { city: "Aqaba", aliases: ["aqaba", "العقبة"] },
    ],
  },
  "saudi arabia": {
    country: "Saudi Arabia",
    baseUrl: "https://sa.opensooq.com",
    defaultCity: "Riyadh",
    keywords: [
      "سائق",
      "توصيل",
      "تنظيف",
      "خادمة",
      "عاملة منزلية",
      "سباك",
      "نجار",
      "كهربائي",
      "دهان",
      "طباخ",
      "مربية",
      "صيانة",
      "تكييف",
      "نقل اثاث",
    ],
    cityMatchers: [
      { city: "Riyadh", aliases: ["riyadh", "الرياض"] },
      { city: "Jeddah", aliases: ["jeddah", "جدة", "جده"] },
      { city: "Dammam", aliases: ["dammam", "الدمام"] },
      { city: "Mecca", aliases: ["mecca", "makkah", "مكة"] },
      { city: "Medina", aliases: ["medina", "madinah", "المدينة"] },
      { city: "Khobar", aliases: ["khobar", "al khobar", "الخبر"] },
      { city: "Tabuk", aliases: ["tabuk", "تبوك"] },
      { city: "Jubail", aliases: ["jubail", "الجبيل"] },
      { city: "Yanbu", aliases: ["yanbu", "ينبع"] },
      { city: "Abha", aliases: ["abha", "أبها"] },
      { city: "Hail", aliases: ["hail", "حائل"] },
      { city: "Jizan", aliases: ["jizan", "jazan", "جيزان", "جازان"] },
      { city: "Buraidah", aliases: ["buraidah", "buraydah", "بريدة"] },
    ],
  },
  uae: {
    country: "UAE",
    baseUrl: "https://ae.opensooq.com",
    defaultCity: "Dubai",
    keywords: [
      "سائق",
      "توصيل",
      "تنظيف",
      "خادمة",
      "عاملة منزلية",
      "سباك",
      "نجار",
      "كهربائي",
      "دهان",
      "طباخ",
      "مربية",
      "صيانة",
      "تكييف",
      "نقل اثاث",
      "حدائق",
      "تنسيق حدائق",
    ],
    cityMatchers: [
      { city: "Dubai", aliases: ["dubai", "دبي"] },
      { city: "Abu Dhabi", aliases: ["abu dhabi", "abudhabi", "أبو ظبي", "ابوظبي"] },
      { city: "Sharjah", aliases: ["sharjah", "الشارقة"] },
      { city: "Ajman", aliases: ["ajman", "عجمان"] },
      { city: "Al Ain", aliases: ["al ain", "العين"] },
      { city: "Fujairah", aliases: ["fujairah", "الفجيرة", "فجيرة"] },
      { city: "Ras Al Khaimah", aliases: ["ras al khaimah", "ras al khaymah", "رأس الخيمة"] },
      { city: "Umm Al Quwain", aliases: ["umm al quwain", "umm al qaywayn", "أم القيوين", "ام القيوين"] },
    ],
  },
};

function isBroadQuery(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  return normalized.length === 0 || normalized === "household services" || normalized === "household service";
}

function detectCity(config: CountryConfig, text: string): string {
  const normalized = text.toLowerCase();

  for (const matcher of config.cityMatchers) {
    if (matcher.aliases.some((alias) => normalized.includes(alias.toLowerCase()))) {
      return matcher.city;
    }
  }

  return config.defaultCity;
}

export class OpensooqScraper extends BaseScraper {
  constructor() {
    super("OpenSooq", "opensooq");
  }

  protected async performScrape(query: string, country: string): Promise<Job[]> {
    const config = COUNTRY_CONFIG[country.toLowerCase()];
    if (!config) return [];

    const jobs: Job[] = [];
    const seenIds = new Set<string>();
    const searchTerms = isBroadQuery(query) ? config.keywords : [query.trim()];

    const promises = searchTerms.map(async (term) => {
      const url = `${config.baseUrl}/en/find?term=${encodeURIComponent(term)}`;
      try {
        const $ = await this.fetchPage(url);
        
        $('a').each((i, el) => {
          const href = $(el).attr('href');
          if (href && (href.includes('/job-posters/') || href.includes('/search/'))) {
            const title = $(el).find('h2').first().text().trim();
            
            if (title && title.length > 3) {
              const fullText = $(el).text().trim().replace(/\s+/g, ' ');
              
              const id = href.split('/').pop() || href;

              if (seenIds.has(id)) return;
              seenIds.add(id);

              const absoluteUrl = href.startsWith('http') ? href : `${config.baseUrl}${href}`;
              const city = detectCity(config, fullText);
              const category = normalizeCategory(title);
              const company = "Independent Provider";
              const rawPrice = $(el).find('.priceColor').text().trim() || $(el).find('[class*="price"]').text().trim();
              const salary = extractSalary(title) || extractSalary(rawPrice) || extractSalary(fullText);

              jobs.push({
                id: `os-${id}`,
                title: title,
                company: company,
                location: `${city}, ${config.country}`,
                country: config.country,
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
        console.error(`[OpenSooq] Error fetching keyword ${term}:`, err instanceof Error ? err.message : err);
      }
    });

    await Promise.all(promises);

    const validJobs = jobs.filter(j => isMiddleEastJob(j) && j.category !== "other");
    return validJobs;
  }
}
