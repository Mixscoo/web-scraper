"use client";

import { Search, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowRecent(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    // Save to recent
    const updated = [value, ...recentSearches.filter((s) => s !== value)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
    setShowRecent(false);
    onSearch();
  };

  const selectRecent = (search: string) => {
    onChange(search);
    setShowRecent(false);
    onSearch();
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => recentSearches.length > 0 && setShowRecent(true)}
            placeholder="Filter by keyword... e.g. Engineer, Nurse, Driver"
            className="w-full h-14 pl-12 pr-24 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20 text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-amber-500/50 focus:border-indigo-500 dark:focus:border-amber-500 transition-all"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-20 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-sm font-medium transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Recent searches dropdown */}
      {showRecent && recentSearches.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
          <div className="px-4 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Recent Searches
          </div>
          {recentSearches.map((search) => (
            <button
              key={search}
              onClick={() => selectRecent(search)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
            >
              <Search className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              {search}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
