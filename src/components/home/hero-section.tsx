"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Search,
  Globe,
  Hammer,
  Paintbrush,
  Wrench,
  Zap,
  Baby,
  Waves,
  SprayCan,
  Flower2,
  ArrowRight,
} from "lucide-react";

const floatingIcons = [
  { Icon: Hammer, x: "10%", y: "20%", delay: 0 },
  { Icon: Paintbrush, x: "80%", y: "15%", delay: 0.2 },
  { Icon: Wrench, x: "15%", y: "70%", delay: 0.4 },
  { Icon: Zap, x: "85%", y: "65%", delay: 0.6 },
  { Icon: Baby, x: "25%", y: "40%", delay: 0.8 },
  { Icon: Waves, x: "75%", y: "40%", delay: 1.0 },
  { Icon: SprayCan, x: "50%", y: "80%", delay: 1.2 },
  { Icon: Flower2, x: "60%", y: "20%", delay: 1.4 },
];

export function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 via-white to-white dark:from-indigo-950/40 dark:via-gray-900 dark:to-gray-950" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Floating icons (parallax layer 1 — slow) */}
      <motion.div className="absolute inset-0 parallax-layer" style={{ y: y1 }}>
        {floatingIcons.map(({ Icon, x, y, delay }, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ delay, duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Icon className="h-8 w-8 sm:h-12 sm:w-12 text-indigo-600 dark:text-amber-400" />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Glowing orbs */}
      <motion.div className="absolute inset-0 parallax-layer" style={{ y: y2 }}>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-indigo-400/10 dark:bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-amber-400/10 dark:bg-amber-600/10 blur-3xl" />
      </motion.div>

      {/* Content (parallax layer 2 — medium) */}
      <motion.div
        className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto"
        style={{ y: y2, opacity, scale }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/50 dark:border-indigo-500/20 text-sm text-indigo-600 dark:text-indigo-400 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            Real-time scraping from 6+ sources
          </div>
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
        >
          Discover Jobs{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-amber-400 dark:to-orange-500">
            Across the Middle East
          </span>
        </motion.h1>

        <motion.p
          className="mt-6 text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          Browse job listings across Jordan, Saudi Arabia, UAE, Qatar, and beyond
          — all scraped in real time from 6+ sources.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <Link
            href="/jobs"
            className="group flex items-center gap-2 px-8 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-medium text-base shadow-lg shadow-indigo-600/25 dark:shadow-amber-500/25 transition-all hover:scale-105"
          >
            <Globe className="h-4 w-4" />
            Start Browsing
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/sources"
            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 font-medium text-base transition-all hover:scale-105"
          >
            View Sources
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ opacity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-start justify-center p-1.5">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
