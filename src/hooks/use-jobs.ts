"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, FilterState } from "@/lib/types";

interface UseJobsOptions {
  refreshNonce?: number;
  forceRefresh?: boolean;
}

export function useJobs(filters: FilterState, options: UseJobsOptions = {}) {
  const hasCountry = filters.countries.length > 0;
  const refreshNonce = options.refreshNonce ?? 0;
  const forceRefresh = options.forceRefresh ?? false;

  return useQuery<ApiResponse>({
    queryKey: ["jobs", filters, refreshNonce],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.query) params.set("q", filters.query);
      if (hasCountry) params.set("country", filters.countries[0]);
      if (filters.categories.length > 0) params.set("categories", filters.categories.join(","));
      if (filters.sources.length > 0) params.set("sources", filters.sources.join(","));
      params.set("sort", filters.sort);
      params.set("page", String(filters.page));
      params.set("datePosted", filters.datePosted);
      if (forceRefresh) params.set("force", "1");

      const res = await fetch(`/api/scrape?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
    enabled: hasCountry,
    placeholderData: (prev) => prev,
  });
}
