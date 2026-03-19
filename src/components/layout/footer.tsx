import Link from "next/link";
import { SOURCES } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-gray-950/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
                JS
              </div>
              <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                JobScraper
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
              Real-time job aggregator for household and service positions across the Middle East.
              Connecting workers with employers through intelligent web scraping.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Navigate</h3>
            <div className="space-y-2">
              {[
                { href: "/jobs", label: "Search Jobs" },
                { href: "/stats", label: "Statistics" },
                { href: "/map", label: "Map View" },
                { href: "/sources", label: "Data Sources" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-amber-400 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Powered By</h3>
            <div className="space-y-2">
              {SOURCES.map((source) => (
                <span key={source.id} className="block text-sm text-gray-500 dark:text-gray-400">
                  {source.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200/50 dark:border-white/10">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            © {new Date().getFullYear()} JobScraper. This tool aggregates publicly available job listings for
            informational purposes. All job data belongs to the respective job portals.
          </p>
        </div>
      </div>
    </footer>
  );
}
