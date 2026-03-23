"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Globe, ListFilter, ExternalLink } from "lucide-react";

const steps = [
  {
    icon: Globe,
    step: "01",
    title: "Choose a Country",
    description: "Select a Middle East country to discover what job opportunities are available.",
  },
  {
    icon: ListFilter,
    step: "02",
    title: "Browse & Filter",
    description: "Browse aggregated results from 6+ job portals. Use filters to narrow down exactly what you need.",
  },
  {
    icon: ExternalLink,
    step: "03",
    title: "Apply or Export",
    description: "Click through to the original listing to apply, or export all results as CSV/Excel for your team.",
  },
];

export function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 sm:py-32 bg-neutral-50/50 dark:bg-white/[0.02] relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-black dark:text-white">
            How it works
          </h2>
          <p className="mt-4 text-lg text-neutral-500 dark:text-neutral-400">
            Three simple steps to find jobs across the Middle East.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800" />

          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              className="relative text-center"
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-neutral-900 border border-black/[0.06] dark:border-white/[0.08] shadow-lg mb-6 z-10">
                <step.icon className="h-7 w-7 text-black dark:text-white" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold flex items-center justify-center">
                  {step.step}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
