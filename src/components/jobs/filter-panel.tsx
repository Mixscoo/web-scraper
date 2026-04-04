"use client";

import { X } from "lucide-react";
import { CATEGORIES, SOURCES, DATE_FILTERS } from "@/lib/constants";
import { getSourcesForCountry } from "@/lib/source-registry";
import type { FilterState } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  availableCategories?: { id: string; name: string }[];
  onClose?: () => void;
  className?: string;
}

export function FilterPanel({ filters, onChange, availableCategories, onClose, className }: FilterPanelProps) {
  const visibleSources = (filters.countries[0] ? getSourcesForCountry(filters.countries[0]) : SOURCES)
    .filter((source) => source.active);

  const toggle = (key: "countries" | "categories" | "sources", value: string) => {
    const arr = filters[key];
    const updated = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    onChange({ ...filters, [key]: updated, page: 1 });
  };

  const clearAll = () => {
    onChange({
      ...filters,
      categories: [],
      sources: [],
      datePosted: "all",
      sort: "newest",
      page: 1,
    });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.sources.length > 0 ||
    filters.datePosted !== "all" ||
    filters.sort !== "newest";

  return (
    <aside className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-black dark:text-white">Filters</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-[var(--accent)] hover:underline"
            >
              Clear all
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sort By */}
      <div>
        <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
          Sort By
        </h4>
        <select
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value as FilterState["sort"], page: 1 })}
          className="w-full rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-white/5 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="company-az">Company (A-Z)</option>
          <option value="company-za">Company (Z-A)</option>
        </select>
      </div>

      {/* Date Posted */}
      <div>
        <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
          Date Posted
        </h4>
        <div className="flex flex-wrap gap-2">
          {DATE_FILTERS.map((df) => (
            <button
              key={df.value}
              onClick={() => onChange({ ...filters, datePosted: df.value, page: 1 })}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filters.datePosted === df.value
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10"
              )}
            >
              {df.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
          Category
        </h4>
        <div className="flex flex-wrap gap-1.5 max-h-[300px] overflow-y-auto pr-1">  
          {(!availableCategories || availableCategories.length === 0) ? (
            CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggle("categories", cat.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors", 
                  filters.categories.includes(cat.id)
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10"
                )}
              >
                {cat.name}
              </button>
            ))
          ) : (
            availableCategories.map((cat) => (
              <button
                key={cat.id}
                title={cat.id}
                onClick={() => toggle("categories", cat.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors", 
                  filters.categories.includes(cat.id)
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10"
                )}
              >
                {cat.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Source */}
      <div>
        <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
          Source
        </h4>
        <div className="space-y-1">
          {visibleSources.map((source) => (
            <label
              key={source.id}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={filters.sources.includes(source.id)}
                onChange={() => toggle("sources", source.id)}
                className="h-3.5 w-3.5 rounded border-neutral-300 dark:border-neutral-600 text-black dark:text-white focus:ring-black/20 dark:focus:ring-white/20"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{source.name}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
