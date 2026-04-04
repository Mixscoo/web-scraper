import * as cheerio from "cheerio";
import { BaseScraper } from "./base-scraper";
import type { Job } from "../types";
import { extractSalary, generateJobId, getCityCoordinates, normalizeCategory } from "../utils";

const BASE_URL = "https://classifieds.gulfnews.com";
const LIST_URL = `${BASE_URL}/jobs/`;
const MAX_LISTINGS = 20;

const UAE_CITY_MATCHERS: Array<{ city: string; aliases: string[] }> = [
  { city: "Dubai", aliases: ["dubai"] },
  { city: "Abu Dhabi", aliases: ["abu dhabi"] },
  { city: "Sharjah", aliases: ["sharjah"] },
  { city: "Ajman", aliases: ["ajman"] },
  { city: "Al Ain", aliases: ["al ain"] },
  { city: "Fujairah", aliases: ["fujairah"] },
  { city: "Ras Al Khaimah", aliases: ["ras al khaimah", "ras al khaymah"] },
  { city: "Umm Al Quwain", aliases: ["umm al quwain", "umm al qaywayn", "umm al qawain"] },
];

type JobPostingSchema = {
  [key: string]: unknown;
  "@type"?: string;
  title?: string;
  description?: string;
  datePosted?: string;
  hiringOrganization?: {
    name?: string;
  };
  jobLocation?: unknown;
  applicantLocationRequirements?: unknown;
};

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isBroadQuery(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  return normalized.length === 0 || normalized === "household services" || normalized === "household service";
}

function matchesQuery(text: string, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) return true;

  const tokens = normalized.split(/\s+/).filter((token) => token.length > 2);
  if (tokens.length === 0) return true;

  const haystack = text.toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function toAbsoluteUrl(href: string | undefined, fallback: string): string {
  if (!href) return fallback;
  if (href.startsWith("http")) return href;
  return new URL(href, BASE_URL).toString();
}

function detectUaeCity(text: string): string {
  const lower = text.toLowerCase();
  for (const matcher of UAE_CITY_MATCHERS) {
    if (matcher.aliases.some((alias) => lower.includes(alias))) {
      return matcher.city;
    }
  }
  return "UAE";
}

function parsePublishedDate(text: string): string | null {
  const match = cleanText(text).match(/Published\s+(\d+)\s+(minute|hour|day|week|month)s?\s+ago/i);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const unit = match[2].toLowerCase();
  const date = new Date();

  switch (unit) {
    case "minute":
      date.setMinutes(date.getMinutes() - amount);
      break;
    case "hour":
      date.setHours(date.getHours() - amount);
      break;
    case "day":
      date.setDate(date.getDate() - amount);
      break;
    case "week":
      date.setDate(date.getDate() - amount * 7);
      break;
    case "month":
      date.setMonth(date.getMonth() - amount);
      break;
    default:
      return null;
  }

  return date.toISOString();
}

function decodeHtmlToText(value: string): string {
  if (!value) return "";
  const decoded = cheerio.load(`<div>${value}</div>`).text();
  return cleanText(cheerio.load(`<div>${decoded}</div>`).text());
}

function parseStructuredData(raw: string): unknown {
  return JSON.parse(raw) as unknown;
}

function findJobPosting(node: unknown): JobPostingSchema | null {
  if (!node || typeof node !== "object") return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const match = findJobPosting(item);
      if (match) return match;
    }
    return null;
  }

  const record = node as Record<string, unknown>;
  if (record["@type"] === "JobPosting") {
    return record as JobPostingSchema;
  }

  if (record["@graph"]) {
    return findJobPosting(record["@graph"]);
  }

  return null;
}

function extractSchemaLocation(value: unknown): string | null {
  if (!value) return null;

  const locations = Array.isArray(value) ? value : [value];
  for (const location of locations) {
    if (typeof location === "string") {
      const cleaned = cleanText(location);
      if (cleaned) return cleaned;
      continue;
    }

    if (!location || typeof location !== "object") continue;

    const locationRecord = location as Record<string, unknown>;
    const address = locationRecord.address && typeof locationRecord.address === "object"
      ? (locationRecord.address as Record<string, unknown>)
      : locationRecord;

    const parts = [
      typeof address.addressLocality === "string" ? address.addressLocality : null,
      typeof address.addressRegion === "string" ? address.addressRegion : null,
      typeof address.addressCountry === "string"
        ? address.addressCountry
        : address.addressCountry && typeof address.addressCountry === "object" && typeof (address.addressCountry as Record<string, unknown>).name === "string"
          ? String((address.addressCountry as Record<string, unknown>).name)
          : null,
    ].filter(Boolean);

    const cleaned = cleanText(parts.join(", "));
    if (cleaned) return cleaned;
  }

  return null;
}

export class GulfNewsScraper extends BaseScraper {
  constructor() {
    super("Gulf News Classifieds", "gulfnews");
  }

  protected async performScrape(query: string, country: string): Promise<Job[]> {
    if (country.toLowerCase() !== "uae") return [];

    const broadQuery = isBroadQuery(query);
    const jobs: Job[] = [];
    const seenUrls = new Set<string>();

    const $ = await this.fetchPage(LIST_URL);
    const listings = $(".jobsearch-list-option").slice(0, MAX_LISTINGS).toArray();

    await Promise.allSettled(
      listings.map(async (el) => {
        const card = $(el);
        const titleLink = card.find('h2 a[href*="/job/"]').first();
        const title = cleanText(titleLink.text());
        if (!title) return;

        const detailUrl = toAbsoluteUrl(titleLink.attr("href"), LIST_URL);
        if (seenUrls.has(detailUrl)) return;

        const companyFromCard = cleanText(card.find(".job-company-name").first().text()).replace(/^@\s*/, "") || "Advertiser";
        const sector = cleanText(card.find('a[href*="sector_cat="]').first().text());
        const cardText = cleanText(card.text());
        const queryText = cleanText(`${title} ${companyFromCard} ${sector} ${cardText}`);

        if (!broadQuery && !matchesQuery(queryText, query)) {
          return;
        }

        seenUrls.add(detailUrl);

        const detail = await this.fetchDetail(detailUrl);
        const combinedText = cleanText(`${queryText} ${detail.description} ${detail.location}`);
        if (!broadQuery && !matchesQuery(combinedText, query)) {
          return;
        }

        const city = detectUaeCity(`${detail.location} ${detail.description} ${cardText}`);
        const location = detail.location || (city === "UAE" ? "UAE" : `${city}, UAE`);
        const company = detail.company || companyFromCard;
        const category = normalizeCategory(`${title} ${sector}`);
        if (broadQuery && category === "other") {
          return;
        }

        jobs.push({
          id: generateJobId(title, company, `gulfnews:${detailUrl}`),
          title,
          company,
          location,
          country: "UAE",
          city,
          category,
          description: (detail.description || combinedText).slice(0, 500),
          salary: detail.salary || extractSalary(`${title} ${cardText}`),
          postedDate: detail.postedDate || parsePublishedDate(cardText) || new Date().toISOString(),
          sourceUrl: detailUrl,
          sourceName: "Gulf News Classifieds",
          sourceLogo: "/sources/gulfnews.svg",
          coordinates: getCityCoordinates(city),
          scrapedAt: new Date().toISOString(),
        });
      })
    );

    return jobs;
  }

  private async fetchDetail(url: string): Promise<{
    company: string | null;
    description: string;
    postedDate: string | null;
    location: string | null;
    salary: string | null;
  }> {
    try {
      const $ = await this.fetchPage(url);
      const jobPosting = this.extractJobPosting($);
      const description = jobPosting?.description
        ? decodeHtmlToText(jobPosting.description)
        : cleanText($("article, main, .entry-content").first().text());
      const company = cleanText(jobPosting?.hiringOrganization?.name || "").replace(/^@\s*/, "") || null;
      const postedDate = jobPosting?.datePosted ? new Date(jobPosting.datePosted).toISOString() : null;
      const location =
        extractSchemaLocation(jobPosting?.jobLocation) ||
        extractSchemaLocation(jobPosting?.applicantLocationRequirements) ||
        null;

      return {
        company,
        description,
        postedDate,
        location,
        salary: extractSalary(description),
      };
    } catch {
      return {
        company: null,
        description: "",
        postedDate: null,
        location: null,
        salary: null,
      };
    }
  }

  private extractJobPosting($: cheerio.CheerioAPI): JobPostingSchema | null {
    let jobPosting: JobPostingSchema | null = null;

    $("script[type='application/ld+json']").each((_, el) => {
      if (jobPosting) return;

      const raw = $(el).html();
      if (!raw) return;

      try {
        jobPosting = findJobPosting(parseStructuredData(raw));
      } catch {
        // Ignore malformed structured data blocks.
      }
    });

    return jobPosting;
  }
}