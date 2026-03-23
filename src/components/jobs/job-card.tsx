"use client";

import { motion } from "framer-motion";
import { MapPin, Clock, ExternalLink, Building2 } from "lucide-react";
import type { Job } from "@/lib/types";
import { formatDate, truncate } from "@/lib/utils";

interface JobCardProps {
  job: Job;
  index: number;
  onClick: () => void;
}

export function JobCard({ job, index, onClick }: JobCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className="card p-5 cursor-pointer group hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Source badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="source-badge">
          {job.sourceName}
        </span>
        <span className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500">
          <Clock className="h-3 w-3" />
          Scraped: {formatDate(job.postedDate)}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-black dark:text-white mb-1.5 group-hover:text-[var(--accent)] transition-colors line-clamp-2">
        {job.title}
      </h3>

      {/* Company */}
      <div className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400 mb-2">
        <Building2 className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{job.company}</span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-500 mb-3">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{job.location}</span>
      </div>

      {/* Description */}
      <p className="text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed mb-4 line-clamp-2">
        {truncate(job.description, 120)}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-white/5">
        {job.salary ? (
          <span className="text-xs font-medium text-green-600 dark:text-green-400">{job.salary}</span>
        ) : (
          <span className="text-xs text-neutral-400 dark:text-neutral-500">Salary not listed</span>
        )}
        <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
          View details
          <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </motion.div>
  );
}
