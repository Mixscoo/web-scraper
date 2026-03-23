"use client";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { SlidersHorizontal, Loader2, SearchX, ArrowLeft, Globe } from "lucide-react";
import { SearchBar } from "@/components/jobs/search-bar";
import { FilterPanel } from "@/components/jobs/filter-panel";
import { JobCard } from "@/components/jobs/job-card";
import { JobDetailModal } from "@/components/jobs/job-detail-modal";
import { ExportButton } from "@/components/jobs/export-button";
import { useJobs } from "@/hooks/use-jobs";
import { COUNTRIES } from "@/lib/constants";
import type { FilterState, Job } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
        </div>
      }
    >
      <JobsContent />
    </Suspense>
  );
}

const FLAGCDN_SIZES = [20, 40, 80, 160, 320] as const;

function nearestFlagSize(size: number) {
  return FLAGCDN_SIZES.reduce((best, s) => (Math.abs(s - size) < Math.abs(best - size) ? s : best));
}

function CountryFlag({ code, size = 40 }: { code: string; size?: number }) {
  const w = nearestFlagSize(size);
  return (
    <img
      src={`https://flagcdn.com/w${w}/${code.toLowerCase()}.png`}
      alt=""
      width={size}
      height={Math.round(size * 0.75)}
      className="inline-block"
      loading="lazy"
    />
  );
}

function JobsContent() {
  const searchParams = useSearchParams();
  const initialCountry = searchParams.get("country");

  const [filters, setFilters] = useState<FilterState>({
    query: "",
    countries: initialCountry ? [initialCountry] : [],
    categories: [],
    sources: [],
    datePosted: "all",
    sort: "newest",
    page: 1,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const hasCountry = filters.countries.length > 0;
  const { data, isLoading, isFetching } = useJobs(filters);

  const handleSearch = useCallback(() => {
    setFilters((f) => ({ ...f, query: searchQuery.trim(), page: 1 }));
  }, [searchQuery]);

  const selectCountry = useCallback((name: string) => {
    setFilters((f) => ({ ...f, countries: [name], page: 1 }));
  }, []);

  const goBack = useCallback(() => {
    setFilters((f) => ({ ...f, countries: [], query: "", categories: [], sources: [], datePosted: "all", sort: "newest", page: 1 }));
    setSearchQuery("");
  }, []);

  const displayJobs = data?.jobs ?? [];

  // ---------- Country Browse Landing ----------
  if (!hasCountry) {
    return (
      <div className="min-h-screen">
        <div className="border-b border-black/[0.06] dark:border-white/[0.08] bg-white/50 dark:bg-black/50 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-sm text-neutral-600 dark:text-neutral-300 mb-6">
                <Globe className="h-4 w-4" />
                Select a country to discover jobs
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-3">
                Browse Jobs by Country
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
                Choose a country to scrape and discover available job listings across the Middle East.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {COUNTRIES.map((country, i) => (
              <motion.button
                key={country.code}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                onClick={() => selectCountry(country.name)}
                className="card flex flex-col items-center gap-3 p-6 hover:scale-105 hover:border-neutral-400 dark:hover:border-neutral-500 transition-all text-center group cursor-pointer"
              >
                <CountryFlag code={country.code} size={48} />
                <span className="text-sm font-medium text-black dark:text-white">
                  {country.name}
                </span>
                <span className="text-xs text-neutral-400 dark:text-neutral-500 group-hover:text-[var(--accent)] transition-colors">
                  Discover jobs &rarr;
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------- Results View (Country Selected) ----------
  return (
    <div className="min-h-screen">
      {/* Header with back button + search */}
      <div className="border-b border-black/[0.06] dark:border-white/[0.08] bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              All countries
            </button>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-6"
          >
            <CountryFlag code={COUNTRIES.find((c) => c.name === filters.countries[0])?.code ?? "jo"} size={40} />
            <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">
              Jobs in {filters.countries[0]}
            </h1>
          </motion.div>
          <SearchBar value={searchQuery} onChange={setSearchQuery} onSearch={handleSearch} />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filter Sidebar — Desktop */}
          <div className="hidden md:block w-64 shrink-0">
            <div className="sticky top-24">
              <FilterPanel filters={filters} onChange={setFilters} />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            {hasCountry && (
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {isLoading ? (
                      "Scraping jobs..."
                    ) : (
                      <>
                        <span className="font-semibold text-black dark:text-white">{data?.total ?? 0}</span>{" "}
                        jobs found
                        {data?.sources && data.sources.length > 0 && (
                          <> from <span className="font-medium">{data.sources.length}</span> sources</>
                        )}
                        {data?.cachedAt && (
                      <span className="text-xs text-neutral-400 ml-2">(cached)</span>
                        )}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ExportButton query={filters.query} country={filters.countries[0] || "Jordan"} />
                  <button
                    onClick={() => setShowFilters(true)}
                    className="md:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/15 text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </button>
                </div>
              </div>
            )}

            {/* Active filter chips */}
            {(filters.categories.length > 0 || filters.sources.length > 0 || filters.query) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.query && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-xs font-medium text-black dark:text-white">
                    &ldquo;{filters.query}&rdquo;
                    <button
                      onClick={() => { setFilters((f) => ({ ...f, query: "", page: 1 })); setSearchQuery(""); }}
                      className="ml-0.5 hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                      &times;
                    </button>
                  </span>
                )}
                {filters.categories.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-xs font-medium text-neutral-600 dark:text-neutral-300"
                  >
                    {c}
                    <button
                      onClick={() =>
                        setFilters((f) => ({ ...f, categories: f.categories.filter((x) => x !== c), page: 1 }))
                      }
                      className="ml-0.5 hover:text-neutral-800 dark:hover:text-neutral-200"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Scraping jobs from multiple sources...
                </p>
              </div>
            )}

            {/* No results */}
            {!isLoading && displayJobs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center">
                  <SearchX className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                </div>
                <h3 className="text-lg font-semibold text-black dark:text-white">No jobs found</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
                  Try adjusting your filters or search keyword.
                </p>
              </div>
            )}

            {/* Job Grid */}
            {displayJobs.length > 0 && (
              <>
                <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", isFetching && "opacity-60")}>
                  {displayJobs.map((job, i) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      index={i}
                      onClick={() => setSelectedJob(job)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                      disabled={filters.page <= 1}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400 px-4">
                      Page {data.page} of {data.totalPages}
                    </span>
                    <button
                      onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                      disabled={filters.page >= data.totalPages}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {showFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-t-3xl p-6"
          >
            <FilterPanel filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />
          </motion.div>
        </div>
      )}

      {/* Job Detail Modal */}
      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}
