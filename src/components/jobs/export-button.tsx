"use client";

import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";

interface ExportButtonProps {
  query: string;
  country: string;
}

export function ExportButton({ query, country }: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  const handleExport = (format: "csv" | "xlsx") => {
    const params = new URLSearchParams({ format, q: query, country });
    window.open(`/api/export?${params.toString()}`, "_blank");
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
      >
        <Download className="h-4 w-4" />
        Export
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
            <button
              onClick={() => handleExport("csv")}
              className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Download CSV
            </button>
            <button
              onClick={() => handleExport("xlsx")}
              className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Download Excel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
