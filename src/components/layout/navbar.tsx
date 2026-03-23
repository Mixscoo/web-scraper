"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BarChart3, MapPin, Globe, Menu, X } from "lucide-react";
import { ThemeToggle } from "../ui/theme-toggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home", icon: Globe },
  { href: "/jobs", label: "Jobs", icon: Search },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/map", label: "Map", icon: MapPin },
  { href: "/sources", label: "Sources", icon: Globe },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-black/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold text-sm">
                JS
              </div>
              <span className="text-lg font-semibold tracking-tight text-black dark:text-white">
                JobScraper
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-full transition-colors",
                      isActive
                        ? "text-black dark:text-white"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="navbar-active"
                        className="absolute inset-0 rounded-full bg-black/[0.05] dark:bg-white/[0.08]"
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      />
                    )}
                    <link.icon className="relative h-4 w-4" />
                    <span className="relative">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08] md:hidden"
          >
            <div className="p-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                      isActive
                        ? "bg-black/[0.05] dark:bg-white/[0.08] text-black dark:text-white"
                        : "text-neutral-500 dark:text-neutral-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
