"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { COUNTRIES } from "@/lib/constants";
import { ArrowRight } from "lucide-react";

export function CountriesSection() {
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
            Covering the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-neutral-500 dark:from-[var(--accent)] dark:to-neutral-400">
              Middle East
            </span>
          </h2>
          <p className="mt-4 text-lg text-neutral-500 dark:text-neutral-400">
            We scrape job listings from all major countries in the region.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {COUNTRIES.map((country, i) => (
            <motion.div
              key={country.code}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link
                href={`/jobs?country=${encodeURIComponent(country.name)}`}
                className="card flex flex-col items-center gap-3 p-6 hover:scale-105 transition-transform text-center group"
              >
                <img
                  src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                  alt=""
                  width={40}
                  height={30}
                  className="inline-block"
                  loading="lazy"
                />
                <span className="text-sm font-medium text-black dark:text-white">
                  {country.name}
                </span>
                <span className="text-xs text-neutral-400 dark:text-neutral-500 group-hover:text-[var(--accent)] transition-colors">
                  Browse jobs →
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Search all countries
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
