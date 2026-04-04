"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, XCircle } from "lucide-react";
import { COUNTRIES, SOURCES } from "@/lib/constants";
import { getSourcesForCountry } from "@/lib/source-registry";
import type { SourceHealthResponse, SourceHealthSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

function getSourceDisplayUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");
  }
}

function formatShortTimestamp(value: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getHealthBadge(health: SourceHealthSummary | undefined, loading: boolean) {
  if (loading && !health) {
    return {
      label: "Checking",
      className: "text-neutral-500 dark:text-neutral-400",
      Icon: Clock3,
    };
  }

  if (!health || health.state === "unknown") {
    return {
      label: "Not tested",
      className: "text-neutral-500 dark:text-neutral-400",
      Icon: Clock3,
    };
  }

  if (health.state === "paused") {
    return {
      label: "Auto-paused",
      className: "text-amber-600 dark:text-amber-400",
      Icon: AlertTriangle,
    };
  }

  if (health.state === "warning") {
    return {
      label: "Monitoring",
      className: "text-orange-600 dark:text-orange-400",
      Icon: AlertTriangle,
    };
  }

  return {
    label: "Healthy",
    className: "text-green-600 dark:text-green-400",
    Icon: CheckCircle2,
  };
}

function getHealthMessage(health: SourceHealthSummary | undefined, country: string): string {
  if (!health || health.state === "unknown") {
    return `No ${country} health history yet.`;
  }

  if (health.state === "paused") {
    const until = formatShortTimestamp(health.disabledUntil);
    return until
      ? `${health.reason}. Retry after ${until}.`
      : `${health.reason}.`;
  }

  if (health.state === "warning") {
    return `${health.reason ?? "Recent instability detected"}. Last run returned ${health.lastResultCount} jobs.`;
  }

  const lastSuccess = formatShortTimestamp(health.lastSuccessAt);
  return lastSuccess
    ? `Last successful ${country} run returned ${health.lastResultCount} jobs on ${lastSuccess}.`
    : `Last successful ${country} run returned ${health.lastResultCount} jobs.`;
}

function getInactiveMessage(sourceName: string): string {
  if (sourceName === "NaukriGulf") {
    return "Disabled in the live scraper because server-side requests to this site time out before HTML is returned.";
  }

  if (sourceName === "Expatriates") {
    return "Disabled in the live scraper because the runtime fetch path is challenged before the listings page HTML is returned.";
  }

  return "This source is currently disabled in the live scraper rotation.";
}

export default function SourcesPage() {
  const [selectedCountry, setSelectedCountry] = useState("Saudi Arabia");
  const [healthBySourceId, setHealthBySourceId] = useState<Record<string, SourceHealthSummary>>({});
  const [loadingHealth, setLoadingHealth] = useState(true);
  const visibleSources = getSourcesForCountry(selectedCountry);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      setLoadingHealth(true);

      try {
        const response = await fetch(`/api/sources/health?country=${encodeURIComponent(selectedCountry)}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch source health");
        }

        const data = (await response.json()) as SourceHealthResponse;
        if (cancelled) return;

        setHealthBySourceId(
          Object.fromEntries(data.sources.map((source) => [source.sourceId, source]))
        );
      } catch {
        if (!cancelled) {
          setHealthBySourceId({});
        }
      } finally {
        if (!cancelled) {
          setLoadingHealth(false);
        }
      }
    }

    void loadHealth();

    return () => {
      cancelled = true;
    };
  }, [selectedCountry]);

  return (
    <div className="min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold text-black dark:text-white">Data Sources</h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            We aggregate job listings from these trusted Middle East job portals.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 rounded-3xl border border-black/[0.06] bg-black/[0.02] p-5 dark:border-white/[0.06] dark:bg-white/[0.03]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400">
            Automatic Source Health
          </p>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            Status below is specific to each country. Sources that keep returning zero jobs or hard failures are paused automatically for a while.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {COUNTRIES.map((country) => (
              <button
                key={country.code}
                onClick={() => setSelectedCountry(country.name)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  selectedCountry === country.name
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10"
                )}
              >
                {country.name}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {visibleSources.map((source, i) => {
            const health = healthBySourceId[source.id];
            const badge = source.active
              ? getHealthBadge(health, loadingHealth)
              : { label: "Inactive", className: "text-red-500 dark:text-red-400", Icon: XCircle };

            return (
              <motion.div
                key={source.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 flex flex-col"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white font-bold text-lg">
                      {source.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-black dark:text-white">{source.name}</h3>
                      <span
                        title={source.url}
                        className="block truncate text-xs text-neutral-400 dark:text-neutral-500"
                      >
                        {getSourceDisplayUrl(source.url)}
                      </span>
                    </div>
                  </div>
                  <span className={cn("flex shrink-0 items-center gap-1 text-xs font-medium", badge.className)}>
                    <badge.Icon className="h-3.5 w-3.5" />
                    {badge.label}
                  </span>
                </div>

                <div className="flex-1">
                  <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {source.description}
                  </p>
                  <div className="mt-4 space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <p>{source.active ? getHealthMessage(health, selectedCountry) : getInactiveMessage(source.name)}</p>
                    {health?.lastRunAt ? <p>Last live scrape: {formatShortTimestamp(health.lastRunAt)}</p> : null}
                  </div>
                </div>

                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
                >
                  Visit website
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </motion.div>
            );
          })}
        </div>

        {/* Legal Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="card p-6 bg-neutral-50/50 dark:bg-white/[0.02] border-neutral-200/50 dark:border-white/[0.06]"
        >
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-300 mb-2">
            Disclaimer
          </h3>
          <p className="text-sm text-neutral-600/80 dark:text-neutral-400/70 leading-relaxed">
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
