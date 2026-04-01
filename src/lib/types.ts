export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  city: string;
  category: string;
  description: string;
  salary: string | null;
  postedDate: string;
  sourceUrl: string;
  sourceName: string;
  sourceLogo: string;
  coordinates: { lat: number; lng: number } | null;
  scrapedAt: string;
}

export interface ScraperResult {
  jobs: Job[];
  sourceId: string;
  sourceName: string;
  success: boolean;
  skipped?: boolean;
  skipReason?: string;
  error?: string;
  scrapedAt: string;
}

export type SourceHealthState = "healthy" | "warning" | "paused" | "unknown";

export interface SourceHealthSummary {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  catalogActive: boolean;
  country: string;
  state: SourceHealthState;
  reason: string | null;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastResultCount: number;
  consecutiveZeroResults: number;
  consecutiveFailures: number;
  disabledUntil: string | null;
  totalRuns: number;
  totalJobsCollected: number;
}

export interface SourceHealthResponse {
  country: string;
  sources: SourceHealthSummary[];
}

export interface FilterState {
  query: string;
  countries: string[];
  categories: string[];
  sources: string[];
  datePosted: "all" | "24h" | "week" | "month";
  sort: "newest" | "oldest" | "company-az" | "company-za";
  page: number;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  logo: string;
  description: string;
  active: boolean;
}

export interface StatsData {
  totalJobs: number;
  activeCountries: number;
  activeSources: number;
  topCategory: string;
  topCompanies: { name: string; count: number }[];
  jobsByCountry: { name: string; count: number }[];
  jobsByCategory: { name: string; count: number }[];
  jobsBySource: { name: string; count: number }[];
  jobsOverTime: { date: string; count: number }[];
  // Market intelligence additions
  demandRanking: { category: string; count: number; percentage: number }[];
  salaryByCategory: { category: string; min: number | null; avg: number | null; max: number | null; currency: string; count: number }[];
  jobsByCity: { name: string; count: number }[];
  companiesByCategory: { category: string; companies: { name: string; count: number }[] }[];
  otherJobTitles: { title: string; count: number }[];
}

export interface ApiResponse {
  jobs: Job[];
  total: number;
  sources: string[];
  availableCategories?: { id: string; name: string }[];
  sourceHealth?: SourceHealthSummary[];
  cachedAt: string | null;
  liveScrapedAt: string | null;
  page: number;
  totalPages: number;
}
