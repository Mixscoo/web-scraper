import type { Job, StatsData } from "./types";
import { COUNTRIES, SOURCES } from "./constants";
import { processSingleton } from "./singleton";

class JobStore {
  private jobs = new Map<string, Job>();

  addJobs(jobs: Job[]): void {
    for (const job of jobs) {
      const key = `${job.title.toLowerCase().trim()}|${job.company.toLowerCase().trim()}|${job.sourceName.toLowerCase()}`;
      if (!this.jobs.has(key)) {
        this.jobs.set(key, job);
      }
    }
    // Cap at 50k entries to prevent memory issues
    if (this.jobs.size > 50000) {
      const entries = Array.from(this.jobs.entries());
      this.jobs = new Map(entries.slice(-40000));
    }
  }

  getJobs(country?: string): Job[] {
    const all = Array.from(this.jobs.values());
    if (!country) return all;
    return all.filter((j) => j.country.toLowerCase() === country.toLowerCase());
  }

  getStats(country?: string): StatsData {
    const jobs = this.getJobs(country);

    // Jobs by country
    const byCountry = new Map<string, number>();
    for (const c of COUNTRIES) byCountry.set(c.name, 0);
    for (const j of jobs) {
      byCountry.set(j.country, (byCountry.get(j.country) || 0) + 1);
    }
    const jobsByCountry = Array.from(byCountry.entries())
      .map(([name, count]) => ({ name, count }))
      .filter((e) => e.count > 0 || !country)
      .sort((a, b) => b.count - a.count);

    // Jobs by category
    const byCategory = new Map<string, number>();
    for (const j of jobs) {
      byCategory.set(j.category, (byCategory.get(j.category) || 0) + 1);
    }
    const jobsByCategory = Array.from(byCategory.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Jobs by source
    const bySource = new Map<string, number>();
    for (const s of SOURCES) bySource.set(s.name, 0);
    for (const j of jobs) {
      bySource.set(j.sourceName, (bySource.get(j.sourceName) || 0) + 1);
    }
    const jobsBySource = Array.from(bySource.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Top companies
    const byCompany = new Map<string, number>();
    for (const j of jobs) {
      byCompany.set(j.company, (byCompany.get(j.company) || 0) + 1);
    }
    const topCompanies = Array.from(byCompany.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Jobs over time (last 14 days)
    const now = new Date();
    const jobsOverTime = Array.from({ length: 14 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (13 - i));
      const dateStr = date.toISOString().split("T")[0];
      const count = jobs.filter((j) => {
        const jDate = new Date(j.scrapedAt).toISOString().split("T")[0];
        return jDate === dateStr;
      }).length;
      return { date: dateStr, count };
    });

    // Top category
    const topCategory = jobsByCategory[0]?.name || "N/A";

    // Active countries with jobs
    const countriesWithJobs = new Set(jobs.map((j) => j.country));

    // --- Market Intelligence ---

    // Demand Ranking: categories sorted by count with percentage
    const demandRanking = jobsByCategory
      .filter((c) => c.count > 0)
      .map((c) => ({
        category: c.name,
        count: c.count,
        percentage: jobs.length > 0 ? Math.round((c.count / jobs.length) * 100) : 0,
      }));

    // Salary by Category: parse salary strings, extract numeric values
    const salaryByCategory = this.computeSalaryByCategory(jobs);

    // Jobs by City: geographic breakdown
    const byCity = new Map<string, number>();
    for (const j of jobs) {
      const city = j.city?.trim() || "Unknown";
      if (city && city !== "Unknown") {
        byCity.set(city, (byCity.get(city) || 0) + 1);
      }
    }
    const jobsByCity = Array.from(byCity.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Companies by Category: top 5 companies per category
    const catCompanyMap = new Map<string, Map<string, number>>();
    for (const j of jobs) {
      if (!catCompanyMap.has(j.category)) catCompanyMap.set(j.category, new Map());
      const companies = catCompanyMap.get(j.category)!;
      companies.set(j.company, (companies.get(j.company) || 0) + 1);
    }
    const companiesByCategory = Array.from(catCompanyMap.entries())
      .map(([category, companies]) => ({
        category,
        companies: Array.from(companies.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      }))
      .sort((a, b) => {
        const aTotal = a.companies.reduce((s, c) => s + c.count, 0);
        const bTotal = b.companies.reduce((s, c) => s + c.count, 0);
        return bTotal - aTotal;
      });

    // Extract top 10 unidentified jobs ("Other") to display on stats page
    const otherTitlesCount = new Map<string, number>();
    for (const j of jobs) {
      if (j.category === "other") {
        otherTitlesCount.set(j.title, (otherTitlesCount.get(j.title) || 0) + 1);
      }
    }
    const otherJobTitles = Array.from(otherTitlesCount.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalJobs: jobs.length,
      activeCountries: country ? 1 : countriesWithJobs.size,
      activeSources: new Set(jobs.map((j) => j.sourceName)).size,
      topCategory,
      topCompanies,
      jobsByCountry,
      jobsByCategory,
      jobsBySource,
      jobsOverTime,
      demandRanking,
      salaryByCategory,
      jobsByCity,
      companiesByCategory,
      otherJobTitles,
    };
  }

  private computeSalaryByCategory(jobs: Job[]): StatsData["salaryByCategory"] {
    const byCat = new Map<string, number[]>();
    const currencyByCat = new Map<string, string>();

    for (const j of jobs) {
      if (!j.salary) continue;
      const nums = j.salary.match(/[\d,]+/g);
      if (!nums || nums.length === 0) continue;

      const values = nums.map((n) => parseInt(n.replace(/,/g, ""), 10)).filter((n) => n > 0 && n < 1000000);
      if (values.length === 0) continue;

      if (!byCat.has(j.category)) byCat.set(j.category, []);
      byCat.get(j.category)!.push(...values);

      // Detect currency
      if (!currencyByCat.has(j.category)) {
        const currMatch = j.salary.match(/AED|JOD|SAR|QAR|BHD|KWD|OMR|IQD|LBP|EGP|USD|\$/);
        if (currMatch) currencyByCat.set(j.category, currMatch[0] === "$" ? "USD" : currMatch[0]);
      }
    }

    return Array.from(byCat.entries())
      .map(([category, values]) => {
        const sorted = values.sort((a, b) => a - b);
        return {
          category,
          min: sorted[0],
          avg: Math.round(sorted.reduce((s, v) => s + v, 0) / sorted.length),
          max: sorted[sorted.length - 1],
          currency: currencyByCat.get(category) || "USD",
          count: sorted.length,
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  get size(): number {
    return this.jobs.size;
  }
}

export const jobStore = processSingleton("jobStore", () => new JobStore());
