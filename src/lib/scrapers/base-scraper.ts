import * as cheerio from "cheerio";
import type { Job } from "../types";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
];

export abstract class BaseScraper {
  protected name: string;
  protected sourceId: string;
  protected headers: Record<string, string>;
  private maxRetries = 2;

  constructor(name: string, sourceId?: string) {
    this.name = name;
    this.sourceId = sourceId ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "");
    this.headers = {
      "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Priority": "u=0, i"
    };
  }

  async scrape(query: string, country: string, category?: string): Promise<Job[]> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        this.headers["User-Agent"] =
          USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
        return await this.performScrape(query, country, category);
      } catch (error) {
        if (attempt === this.maxRetries) {
          console.error(`[${this.name}] Failed after ${this.maxRetries + 1} attempts:`, error instanceof Error ? error.message : error);
          throw error;
        }
        await this.delay(1000 * (attempt + 1));
      }
    }
    throw new Error(`[${this.name}] Scrape aborted unexpectedly`);
  }

  getSourceId(): string {
    return this.sourceId;
  }

  getSourceName(): string {
    return this.name;
  }

  protected abstract performScrape(query: string, country: string, category?: string): Promise<Job[]>;

  protected async fetchPage(url: string): Promise<cheerio.CheerioAPI> {
    const response = await fetch(url, {
      headers: this.headers,
      signal: AbortSignal.timeout(10000),
    });
    const html = await response.text();
    return cheerio.load(html);
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected getSourceLogo(): string {
    return `/sources/${this.name.toLowerCase().replace(/[\s.]+/g, "")}.svg`;
  }
}
