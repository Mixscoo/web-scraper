"use client";

import { motion } from "framer-motion";
import { ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { SOURCES } from "@/lib/constants";

export default function SourcesPage() {
  return (
    <div className="min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Sources</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            We aggregate job listings from these trusted Middle East job portals.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {SOURCES.map((source, i) => (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card p-6 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-amber-400 font-bold text-lg">
                    {source.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{source.name}</h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{source.url.replace("https://www.", "")}</span>
                  </div>
                </div>
                {source.active ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400">
                    <XCircle className="h-3.5 w-3.5" />
                    Inactive
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1">
                {source.description}
              </p>

              {/* Footer */}
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-amber-400 hover:underline"
              >
                Visit website
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </motion.div>
          ))}
        </div>

        {/* Legal Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="card p-6 bg-amber-50/50 dark:bg-amber-500/5 border-amber-200/50 dark:border-amber-500/10"
        >
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-2">
            Disclaimer
          </h3>
          <p className="text-sm text-amber-700/80 dark:text-amber-400/70 leading-relaxed">
            This tool aggregates publicly available job listings from third-party websites for
            informational purposes only. All job data, trademarks, and content belong to their
            respective owners. We do not claim ownership of any scraped data. Users should verify
            job listings directly on the source websites before applying. This tool is intended
            for internal use to assist in connecting workers with employers. Please respect each
            site&apos;s terms of service and robots.txt directives.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
