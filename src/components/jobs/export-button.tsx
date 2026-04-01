"use client";

import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import type { FilterState } from "@/lib/types";

interface ExportButtonProps {
  query: string;
  country: string;
  categories?: string[];
  sources?: string[];
  datePosted?: FilterState["datePosted"];
  sort?: FilterState["sort"];
  onExportStateChange?: (isExporting: boolean) => void;
}

function getDownloadFileName(contentDisposition: string | null, fallback: string): string {
  if (!contentDisposition) return fallback;

  const match = contentDisposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? fallback;
}

export function ExportButton({
  query,
  country,
  categories = [],
  sources = [],
  datePosted = "all",
  sort = "newest",
  onExportStateChange,
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "csv" | "xlsx") => {
    const params = new URLSearchParams({ format, country, datePosted, sort });
    if (query) params.set("q", query);
    if (categories.length > 0) params.set("categories", categories.join(","));
    if (sources.length > 0) params.set("sources", sources.join(","));

    setIsExporting(true);
    onExportStateChange?.(true);

    try {
      const response = await fetch(`/api/export?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const fallbackName = format === "csv" ? "jobs-export.csv" : "jobs-export.xlsx";
      const fileName = getDownloadFileName(response.headers.get("Content-Disposition"), fallbackName);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } finally {
      setIsExporting(false);
      onExportStateChange?.(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/15 text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
      >
        <Download className="h-4 w-4" />
        {isExporting ? "Exporting..." : "Export"}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-[#141414] border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl overflow-hidden z-20">
            <button
              onClick={() => handleExport("csv")}
              disabled={isExporting}
              className="w-full px-4 py-2.5 text-sm text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
            >
              Download CSV
            </button>
            <button
              onClick={() => handleExport("xlsx")}
              disabled={isExporting}
              className="w-full px-4 py-2.5 text-sm text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
            >
              Download Excel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
