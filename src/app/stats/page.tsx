"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { Briefcase, Globe, Radio, TrendingUp, Building2, MapPin, DollarSign, BarChart3 , HelpCircle, AlertCircle, RotateCw } from "lucide-react";
import { useTheme } from "next-themes";
import { COUNTRIES } from "@/lib/constants";
import type { StatsData } from "@/lib/types";
import { cn } from "@/lib/utils";

const CHART_COLORS_LIGHT = ["#111111", "#B8860B", "#2E8B57", "#C05746", "#3A6EA5", "#8B5DA0", "#5D8A3C", "#D4763A", "#2A7B8E", "#A67C3D"];
const CHART_COLORS_DARK = ["#F5F5F5", "#E8C44A", "#4ADE80", "#F87171", "#60A5FA", "#C084FC", "#86D460", "#FB923C", "#38BDF8", "#FBBF24"];

// Recharts sizes pies and axes in pixels, so a card narrower than the chart
// makes it overflow instead of shrink. Measuring the card lets us swap outside
// labels for a legend once there is no longer room to draw them.
function useElementWidth<T extends HTMLElement>() {
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  // A callback ref, not useRef + useEffect: these cards mount only once stats
  // have loaded, so an effect with [] deps would run while the node is still
  // null and never attach the observer (leaving width stuck at 0).
  const ref = useCallback((node: T | null) => {
    observerRef.current?.disconnect();
    if (!node) return;

    setWidth(node.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  return [ref, width] as const;
}

function StatCard({ icon: Icon, label, value, delay }: { icon: typeof Briefcase; label: string; value: string | number; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="card p-6"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-bold text-black dark:text-white">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </motion.div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scraping, setScraping] = useState(false);
  const [categoryCardRef, categoryCardWidth] = useElementWidth<HTMLDivElement>();

  // Below this the outside labels no longer fit beside the pie; show a legend.
  const CATEGORY_LABELS_FIT = categoryCardWidth >= 360;

  const cityData = (stats?.jobsByCity ?? []).slice(0, 10);
  const cityTotal = (stats?.jobsByCity ?? []).reduce((sum, c) => sum + c.count, 0);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const chartColors = isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;
  const primaryColor = isDark ? "#FAFAFA" : "#0A0A0A";

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: "var(--card)",
      border: "1px solid var(--card-border)",
      borderRadius: 12,
      fontSize: 12,
      color: "var(--foreground)",
    },
    labelStyle: { color: "var(--foreground)" },
    itemStyle: { color: "var(--foreground)" },
  };

  const fetchStats = useCallback(async (country?: string, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    const params = country ? `?country=${encodeURIComponent(country)}` : "";
    try {
      const res = await fetch(`/api/stats${params}`, { cache: "no-store", signal });
      if (!res.ok) throw new Error(`Statistics request failed (${res.status})`);
      const data: StatsData = await res.json();
      setStats(data);
      setLoading(false);
    } catch (e) {
      // A superseded request was cancelled — the newer one owns the state now.
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Failed to load statistics");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchStats(selectedCountry || undefined, controller.signal);
    return () => controller.abort();
  }, [selectedCountry, fetchStats]);

  // Scraping is opt-in from the empty state: it takes a couple of minutes, so
  // it must never block the initial render of this page.
  const runScrape = useCallback(async () => {
    setScraping(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: "household services",
        country: selectedCountry || "Jordan",
      });
      const res = await fetch(`/api/scrape?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Scrape failed (${res.status})`);
      await res.json();
      await fetchStats(selectedCountry || undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scrape failed");
    } finally {
      setScraping(false);
    }
  }, [selectedCountry, fetchStats]);

  return (
    <div className="min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-black dark:text-white">Statistics</h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">Overview of scraped provider & listing data across the Middle East.</p>
        </motion.div>

        {/* Country Selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCountry("")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
              !selectedCountry
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10"
            )}
          >
            All Countries
          </button>
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelectedCountry(c.name)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                selectedCountry === c.name
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10"
              )}
            >
              <img
                src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`}
                alt=""
                width={20}
                height={15}
                className="inline-block"
              />
              {c.name}
            </button>
          ))}
        </div>

        {scraping ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black dark:border-white border-t-transparent" />
            <h3 className="text-lg font-semibold text-black dark:text-white">
              Scraping {selectedCountry || "Jordan"}…
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
              Collecting listings from every active source. This usually takes one to
              three minutes — you can leave this page open.
            </p>
          </div>
        ) : loading || (!stats && !error) ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black dark:border-white border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white">Couldn&apos;t load statistics</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">{error}</p>
            <button
              onClick={() => fetchStats(selectedCountry || undefined)}
              className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              <RotateCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : !stats || stats.totalJobs === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white">No data yet</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
              {selectedCountry
                ? `No jobs have been scraped for ${selectedCountry} yet. Scrape it now, or browse this country on the Jobs page.`
                : "No jobs have been scraped yet. Scrape a country now, or browse one on the Jobs page to start collecting data."}
            </p>
            <button
              onClick={runScrape}
              className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              <RotateCw className="h-4 w-4" />
              Scrape {selectedCountry || "Jordan"} now
            </button>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <StatCard icon={Briefcase} label="Total Providers" value={stats.totalJobs} delay={0} />
              <StatCard icon={Globe} label="Countries" value={stats.activeCountries} delay={0.1} />
              <StatCard icon={Radio} label="Sources" value={stats.activeSources} delay={0.2} />
              <StatCard icon={TrendingUp} label="Top Category" value={stats.topCategory.replace(/-/g, " ")} delay={0.3} />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Providers by Country */}
              {!selectedCountry && stats.jobsByCountry.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="card p-6"
                >
                  <h3 className="text-sm font-semibold text-black dark:text-white mb-4">Providers by Country</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.jobsByCountry}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-fg)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-fg)" />
                      <Tooltip {...tooltipStyle} cursor={{ fill: "var(--card-border)" }} />
                      <Bar dataKey="count" fill={primaryColor} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Providers by Category (Pie) */}
              {stats.jobsByCategory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="card p-6 min-w-0"
                  ref={categoryCardRef}
                >
                  <h3 className="text-sm font-semibold text-black dark:text-white mb-4">Providers by Category</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.jobsByCategory.slice(0, 8)}
                        cx="50%"
                        cy="50%"
                        outerRadius={CATEGORY_LABELS_FIT ? "70%" : "80%"}
                        dataKey="count"
                        nameKey="name"
                        label={
                          CATEGORY_LABELS_FIT
                            ? ({ name, x, y, textAnchor }) => (
                                <text x={x} y={y} textAnchor={textAnchor} fill="var(--foreground)" fontSize={10} className="capitalize">
                                  {name?.replace(/-/g, " ") || ""}
                                </text>
                              )
                            : false
                        }
                        labelLine={false}
                        fontSize={10}
                        fill="var(--foreground)"
                        className="capitalize"
                      >
                        {stats.jobsByCategory.slice(0, 8).map((_, i) => (
                          <Cell key={i} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                      {!CATEGORY_LABELS_FIT && (
                        <Legend
                          verticalAlign="bottom"
                          height={48}
                          iconSize={8}
                          formatter={(value) => (
                            <span style={{ color: "var(--foreground)", fontSize: 10, textTransform: "capitalize" }}>
                              {String(value).replace(/-/g, " ")}
                            </span>
                          )}
                        />
                      )}
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Providers Over Time */}
              {stats.jobsOverTime.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="card p-6"
                >
                  <h3 className="text-sm font-semibold text-black dark:text-white mb-4">Providers Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.jobsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-fg)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-fg)" />
                      <Tooltip {...tooltipStyle} cursor={{ stroke: "var(--muted-fg)" }} />
                      <Line type="monotone" dataKey="count" stroke={primaryColor} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Listings by Source (Horizontal bar) */}
              {stats.jobsBySource.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="card p-6"
                >
                  <h3 className="text-sm font-semibold text-black dark:text-white mb-4">Listings by Source</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.jobsBySource} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-fg)" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width="auto" stroke="var(--muted-fg)" />
                      <Tooltip {...tooltipStyle} cursor={{ fill: "var(--card-border)" }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {stats.jobsBySource.map((_, i) => (
                          <Cell key={i} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Top Companies */}
              {stats.topCompanies.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="card p-6 lg:col-span-2"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-4 w-4 text-black dark:text-white" />
                    <h3 className="text-sm font-semibold text-black dark:text-white">Top Companies</h3>
                  </div>
                  {/* Horizontal, like Providers by City: company names are long
                      ("The Ritz-Carlton Hotel Company, L.L.C.") and collided with
                      each other as angled labels under a vertical bar chart. */}
                  <ResponsiveContainer width="100%" height={Math.max(300, stats.topCompanies.length * 30)}>
                    <BarChart data={stats.topCompanies} layout="vertical" margin={{ left: 4, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-fg)" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width="auto" stroke="var(--muted-fg)" />
                      <Tooltip {...tooltipStyle} cursor={{ fill: "var(--card-border)" }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {stats.topCompanies.map((_, i) => (
                          <Cell key={i} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </div>

            {/* Market Intelligence Section */}
            <div className="mt-10 mb-6">
              <h2 className="text-xl font-bold text-black dark:text-white">Market Intelligence</h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Provider demand analysis, salary benchmarks, and geographic breakdown.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demand Ranking */}
              {stats.demandRanking && stats.demandRanking.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="card p-6 lg:col-span-2"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-4 w-4 text-black dark:text-white" />
                    <h3 className="text-sm font-semibold text-black dark:text-white">Service Demand Ranking</h3>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-auto">Which services are most in demand</span>
                  </div>
                  <ResponsiveContainer width="100%" height={Math.max(300, stats.demandRanking.length * 28)}>
                    <BarChart data={stats.demandRanking} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-fg)" />
                      <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width="auto" stroke="var(--muted-fg)" />
                      <Tooltip
                        formatter={(value, _name, props) => {
                          const pct = (props.payload as { percentage?: number })?.percentage ?? 0;
                          return [`${value} jobs (${pct}%)`, "Count"];
                        }}
                        contentStyle={{
                          ...tooltipStyle.contentStyle,
                          textTransform: "capitalize",
                        }}
                        labelStyle={tooltipStyle.labelStyle}
                        itemStyle={tooltipStyle.itemStyle}
                        cursor={{ fill: "var(--card-border)" }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {stats.demandRanking.map((_, i) => (
                          <Cell key={i} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Geographic Breakdown */}
              {stats.jobsByCity && stats.jobsByCity.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="card p-6 min-w-0"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-black dark:text-white" />
                    <h3 className="text-sm font-semibold text-black dark:text-white">Providers by City</h3>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-auto">
                      Top {cityData.length} of {stats.jobsByCity.length}
                    </span>
                  </div>
                  {/* A horizontal bar, not a pie: one city routinely holds ~90% of
                      listings and the rest are 1% slivers whose slice labels all
                      converge on the same angle and overlap. Bars put every name on
                      the axis, so long and right-to-left city names stay readable
                      however many cities the scrape turns up. */}
                  <ResponsiveContainer width="100%" height={Math.max(260, cityData.length * 30)}>
                    <BarChart data={cityData} layout="vertical" margin={{ left: 4, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-fg)" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width="auto" stroke="var(--muted-fg)" />
                      <Tooltip
                        formatter={(value) => {
                          const count = Number(value);
                          const pct = cityTotal > 0 ? ((count / cityTotal) * 100).toFixed(1) : "0";
                          return [`${count} (${pct}%)`, "Providers"];
                        }}
                        contentStyle={tooltipStyle.contentStyle}
                        labelStyle={tooltipStyle.labelStyle}
                        itemStyle={tooltipStyle.itemStyle}
                        cursor={{ fill: "var(--card-border)" }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {cityData.map((_, i) => (
                          <Cell key={i} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Salary Ranges */}
              {stats.salaryByCategory && stats.salaryByCategory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="card p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-4 w-4 text-black dark:text-white" />
                    <h3 className="text-sm font-semibold text-black dark:text-white">Salary Ranges by Service</h3>
                  </div>
                  <div className="overflow-y-auto max-h-[300px]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white dark:bg-[#141414]">
                        <tr className="border-b border-black/[0.06] dark:border-white/[0.08]">
                          <th className="text-left py-2 font-medium text-neutral-500 dark:text-neutral-400">Service</th>
                          <th className="text-right py-2 font-medium text-neutral-500 dark:text-neutral-400">Min</th>
                          <th className="text-right py-2 font-medium text-neutral-500 dark:text-neutral-400">Avg</th>
                          <th className="text-right py-2 font-medium text-neutral-500 dark:text-neutral-400">Max</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.salaryByCategory.map((row) => (
                          <tr key={row.category} className="border-b border-black/[0.04] dark:border-white/[0.04]">
                            <td className="py-2 text-black dark:text-neutral-200 capitalize">{row.category}</td>
                            <td className="py-2 text-right text-neutral-600 dark:text-neutral-400">{row.currency} {row.min?.toLocaleString()}</td>
                            <td className="py-2 text-right font-medium text-green-600 dark:text-green-400">{row.currency} {row.avg?.toLocaleString()}</td>
                            <td className="py-2 text-right text-neutral-600 dark:text-neutral-400">{row.currency} {row.max?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Provider Landscape */}
              {stats.companiesByCategory && stats.companiesByCategory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="card p-6 lg:col-span-2"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-4 w-4 text-black dark:text-white" />
                    <h3 className="text-sm font-semibold text-black dark:text-white">Provider Landscape by Service</h3>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-auto">Top companies per category</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
                    {stats.companiesByCategory.slice(0, 12).map((cat) => (
                      <div key={cat.category} className="rounded-xl bg-neutral-50 dark:bg-white/5 p-3">
                        <h4 className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2 capitalize">{cat.category}</h4>
                        <ul className="space-y-1">
                          {cat.companies.map((company) => (
                            <li key={company.name} className="flex justify-between text-xs">
                              <span className="text-neutral-700 dark:text-neutral-300 truncate mr-2">{company.name}</span>
                              <span className="text-neutral-400 dark:text-neutral-500 flex-shrink-0">{company.count}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Unidentified Jobs Insight */}
              {stats.otherJobTitles && stats.otherJobTitles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                  className="card p-6 lg:col-span-2"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="h-4 w-4 text-[var(--accent)]" />
                    <h3 className="text-sm font-semibold text-black dark:text-white">Unidentified Jobs (Needs Mapping)</h3>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-auto">Top titles falling into "Other"</span>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="flex flex-wrap gap-2">
                      {stats.otherJobTitles.map((job, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-white/5 px-3 py-1.5 text-xs">
                          <span className="text-neutral-700 dark:text-neutral-300">"{job.title}"</span>
                          <span className="text-neutral-400 dark:text-neutral-500 font-mono bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-md">{job.count}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400 italic">
                      These roles failed standard classification and may be picked up by the AI fallback if enabled. Monitor these to expand the taxonomy.
                    </p>
                  </div>
                </motion.div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}
