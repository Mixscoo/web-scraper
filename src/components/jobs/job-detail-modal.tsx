"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, MapPin, Building2, Clock, Tag, Share2 } from "lucide-react";
import type { Job } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
}

export function JobDetailModal({ job, onClose }: JobDetailModalProps) {
  if (!job) return null;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(job.sourceUrl);
  };

  return (
    <AnimatePresence>
      {job && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 bottom-0 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-8 sm:max-w-2xl sm:w-full z-50 max-h-[85vh] overflow-hidden"
          >
            <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-2xl overflow-y-auto max-h-[85vh]">
              {/* Header */}
              <div className="sticky top-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl p-6 pb-4 border-b border-neutral-100 dark:border-white/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span className="source-badge mb-2 inline-block">{job.sourceName}</span>
                    <h2 className="text-xl font-bold text-black dark:text-white">{job.title}</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Meta */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <Building2 className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                    {job.company}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <MapPin className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <Clock className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                    Data Last Scraped: {formatDate(job.postedDate)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <Tag className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                    {job.category}
                  </div>
                </div>

                {job.salary && (
                  <div className="px-4 py-3 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-medium">
                    Salary: {job.salary}
                  </div>
                )}

                {/* Description */}
                <div>
                  <h4 className="text-sm font-semibold text-black dark:text-white mb-2">Description</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line">
                    {job.description}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl p-6 pt-4 border-t border-neutral-100 dark:border-white/5 flex gap-3">
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-medium text-sm transition-colors"
                >
                  View on {job.sourceName}
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center h-11 w-11 rounded-xl bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 transition-colors"
                  title="Copy link"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
