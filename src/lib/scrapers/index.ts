import type { Job, ScraperResult } from "../types";
import { isMiddleEastJob } from "../utils";
import { jobStore } from "../job-store";
import { LinkedInScraper } from "./linkedin";
import { TalentScraper } from "./talent";
import { JSearchScraper } from "./jsearch";
import { AdzunaScraper } from "./adzuna";
import { JoobleScraper } from "./jooble";
import { GrabJobsScraper } from "./careerjet";
import { BaytScraper } from "./remoteok";
import { OpensooqScraper } from "./opensooq";
import type { BaseScraper } from "./base-scraper";

const scrapers: BaseScraper[] = [
  new LinkedInScraper(),
  new TalentScraper(),
  new JSearchScraper(),
  new AdzunaScraper(),
  new JoobleScraper(),
  new GrabJobsScraper(),
  new BaytScraper(),
  new OpensooqScraper(),
];

export async function scrapeAll(
  query: string,
  country: string
): Promise<{ jobs: Job[]; results: ScraperResult[] }> {
  const startTime = Date.now();

  const settled = await Promise.allSettled(
    scrapers.map(async (scraper) => {
      const scraperName = scraper.constructor.name.replace("Scraper", "");
      try {
        const jobs = await scraper.scrape(query, country);
        console.log(`[${scraperName}] Returned ${jobs.length} jobs`);
        return {
          jobs,
          source: scraperName,
          success: true,
          scrapedAt: new Date().toISOString(),
        } as ScraperResult;
      } catch (error) {
        return {
          jobs: [],
          source: scraperName,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          scrapedAt: new Date().toISOString(),
        } as ScraperResult;
      }
    })
  );

  const results: ScraperResult[] = settled.map((s) =>
    s.status === "fulfilled"
      ? s.value
      : { jobs: [], source: "Unknown", success: false, error: "Promise rejected", scrapedAt: new Date().toISOString() }
  );

  const allJobs = results.flatMap((r) => r.jobs);
  const deduped = deduplicateJobs(allJobs);

  // Filter out non-Middle-East jobs
  const meJobs = deduped.filter(isMiddleEastJob);

  // Store in persistent job store for stats
  jobStore.addJobs(meJobs);

  console.log(`[Orchestrator] Scraped ${meJobs.length} unique ME jobs in ${Date.now() - startTime}ms`);
  return { jobs: meJobs, results };
}

function deduplicateJobs(jobs: Job[]): Job[] {
  const seen = new Map<string, Job>();
  for (const job of jobs) {
    const key = `${job.title.toLowerCase().trim()}|${job.company.toLowerCase().trim()}|${job.sourceName.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.set(key, job);
    }
  }
  return Array.from(seen.values());
}
