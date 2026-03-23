"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Globe, Search, Filter, Download } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Real-Time Scraping",
    description:
      "Jobs are scraped live from multiple portals the moment you search — always fresh, always up to date.",
  },
  {
    icon: Globe,
    title: "Multiple Sources",
    description:
      "We aggregate listings from Bayt, Akhtaboot, GulfTalent, Naukrigulf, Indeed, and LinkedIn all at once.",
  },
  {
    icon: Filter,
    title: "Advanced Filters",
    description:
      "Filter by country, job category, date posted, source, and more to find exactly what you need.",
  },
  {
    icon: Download,
    title: "Export Data",
    description:
      "Download search results as CSV or Excel files to share with your team or analyze offline.",
  },
];

export function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 sm:py-32 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-black dark:text-white">
            Everything you need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-neutral-500 dark:from-[var(--accent)] dark:to-neutral-400">
              find jobs faster
            </span>
          </h2>
          <p className="mt-4 text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">
            Our scraper aggregates job listings from the top Middle East job portals —
            saving you hours of manual searching.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="card p-6 sm:p-8 text-center group"
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white mb-5 group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-black dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
