"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, FilterState } from "@/lib/types";

export function useJobs(filters: FilterState) {
  const hasCountry = filters.countries.length > 0;

  return useQuery<ApiResponse>({
    queryKey: ["jobs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.query) params.set("q", filters.query);
      if (hasCountry) params.set("country", filters.countries[0]);
      if (filters.categories.length > 0) params.set("categories", filters.categories.join(","));
      if (filters.sources.length > 0) params.set("sources", filters.sources.join(","));
      params.set("sort", filters.sort);
      params.set("page", String(filters.page));
      params.set("datePosted", filters.datePosted);

      const res = await fetch(`/api/scrape?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
    enabled: hasCountry,
    placeholderData: (prev) => prev,
  });
}
