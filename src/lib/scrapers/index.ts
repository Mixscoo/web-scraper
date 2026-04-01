import type { Job, ScraperResult } from "../types";
import { isMiddleEastJob } from "../utils";
import { jobStore } from "../job-store";
import { categorizeOtherJobs } from "../ai-categorizer";
import { sourceHealth } from "../source-health";
import { LinkedInScraper } from "./linkedin";
import { TalentScraper } from "./talent";
import { JoobleScraper } from "./jooble";
import { GrabJobsScraper } from "./careerjet";
import { OpensooqScraper } from "./opensooq";
import { GulfTalentScraper } from "./gulftalent";
import { JobrapidoScraper } from "./jobrapido";
import { Learn4GoodScraper } from "./learn4good";
import type { BaseScraper } from "./base-scraper";

const scrapers: BaseScraper[] = [
  new LinkedInScraper(),
  new TalentScraper(),
  new JoobleScraper(),
  new GrabJobsScraper(),
  new GulfTalentScraper(),
  new JobrapidoScraper(),
  new Learn4GoodScraper(),
  new OpensooqScraper(),
];

export async function scrapeAll(
  query: string,
  country: string
): Promise<{ jobs: Job[]; results: ScraperResult[] }> {
  const startTime = Date.now();

  const runnableScrapers: Array<{
    scraper: BaseScraper;
    sourceId: string;
    sourceName: string;
  }> = [];
  const skippedResults: ScraperResult[] = [];

  for (const scraper of scrapers) {
    const sourceId = scraper.getSourceId();
    const sourceName = scraper.getSourceName();
    const gate = await sourceHealth.shouldRun(sourceId, country);

    if (!gate.allowed) {
      skippedResults.push({
        jobs: [],
        sourceId,
        sourceName,
        success: false,
        skipped: true,
        skipReason: gate.reason ?? "Auto-paused",
        scrapedAt: new Date().toISOString(),
      });
      console.log(`[${sourceName}] Skipped for ${country}: ${gate.reason}`);
      continue;
    }

    runnableScrapers.push({ scraper, sourceId, sourceName });
  }

  const settled = await Promise.allSettled(
    runnableScrapers.map(async ({ scraper, sourceId, sourceName }) => {
      try {
        const jobs = await scraper.scrape(query, country);
        await sourceHealth.recordRun({
          sourceId,
          country,
          success: true,
          jobsCount: jobs.length,
        });
        console.log(`[${sourceName}] Returned ${jobs.length} jobs`);
        return {
          jobs,
          sourceId,
          sourceName,
          success: true,
          scrapedAt: new Date().toISOString(),
        } as ScraperResult;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        await sourceHealth.recordRun({
          sourceId,
          country,
          success: false,
          jobsCount: 0,
          error: message,
        });
        return {
          jobs: [],
          sourceId,
          sourceName,
          success: false,
          error: message,
          scrapedAt: new Date().toISOString(),
        } as ScraperResult;
      }
    })
  );

  const resultsFromRuns: ScraperResult[] = settled.map((result, index) =>
    result.status === "fulfilled"
      ? result.value
      : {
          jobs: [],
          sourceId: runnableScrapers[index]?.sourceId ?? "unknown",
          sourceName: runnableScrapers[index]?.sourceName ?? "Unknown",
          success: false,
          error: result.reason instanceof Error ? result.reason.message : "Promise rejected",
          scrapedAt: new Date().toISOString(),
        }
  );

  const results: ScraperResult[] = [...resultsFromRuns, ...skippedResults];

  const allJobs = results.flatMap((r) => r.jobs);
  let deduped = deduplicateJobs(allJobs);

  // Fallback: AI classification for "other" jobs
  const otherJobsIndices = deduped
    .map((j, idx) => (j.category === "other" ? idx : -1))
    .filter((idx) => idx !== -1);

  if (otherJobsIndices.length > 0) {
    const titlesToCategorize = otherJobsIndices.map(idx => deduped[idx].title);
    
    // Deduplicate titles to lower AI overhead and prevent length mismatches
    const uniqueTitles = [...new Set(titlesToCategorize)];
    console.log(`[AI] Attempting to categorize ${uniqueTitles.length} unique job titles out of ${titlesToCategorize.length} "other" jobs...`);

    // Batch process to avoid huge payload.
    const BATCH_SIZE = 50;
    const titleToCategoryMap = new Map<string, string>();

    for (let i = 0; i < uniqueTitles.length; i += BATCH_SIZE) {
      const batchTitles = uniqueTitles.slice(i, i + BATCH_SIZE);
      const chunkCategories = await categorizeOtherJobs(batchTitles);

      batchTitles.forEach((title, idx) => {
        titleToCategoryMap.set(title, chunkCategories[idx] || "other");
      });
    }

    // Map the results back to the deduplicated jobs using the title map
    otherJobsIndices.forEach(idx => {
      const jobTitle = deduped[idx].title;
      deduped[idx].category = titleToCategoryMap.get(jobTitle) || "other";
    });
  }

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
