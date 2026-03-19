"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { Briefcase, Globe, Radio, TrendingUp, Building2, MapPin, DollarSign, BarChart3 } from "lucide-react";
import { useTheme } from "next-themes";
import { COUNTRIES } from "@/lib/constants";
import type { StatsData } from "@/lib/types";
import { cn } from "@/lib/utils";

const CHART_COLORS_LIGHT = ["#4F46E5", "#7C3AED", "#EC4899", "#F59E0B", "#10B981", "#06B6D4", "#8B5CF6", "#F97316", "#EF4444", "#3B82F6"];
const CHART_COLORS_DARK = ["#F59E0B", "#FBBF24", "#F97316", "#FB923C", "#A78BFA", "#34D399", "#38BDF8", "#FB7185", "#C084FC", "#2DD4BF"];

function StatCard({ icon: Icon, label, value, delay }: { icon: typeof Briefcase; label: string; value: string | number; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="card p-6"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-amber-400">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </motion.div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const chartColors = isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;
  const primaryColor = isDark ? "#F59E0B" : "#4F46E5";

  const fetchStats = useCallback((country?: string) => {
    setLoading(true);
    const params = country ? `?country=${encodeURIComponent(country)}` : "";
    fetch(`/api/stats${params}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchStats(selectedCountry || undefined);
  }, [selectedCountry, fetchStats]);

  return (
    <div className="min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Statistics</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Overview of scraped provider & listing data across the Middle East.</p>
        </motion.div>

        {/* Country Selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCountry("")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
              !selectedCountry
                ? "bg-indigo-600 dark:bg-amber-500 text-white"
                : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
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
                  ? "bg-indigo-600 dark:bg-amber-500 text-white"
                  : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
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

        {loading || !stats ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 dark:border-amber-400 border-t-transparent" />
          </div>
        ) : stats.totalJobs === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No data yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              {selectedCountry
                ? `No jobs have been scraped for ${selectedCountry} yet. Go to the Jobs page and browse this country first.`
                : "No jobs have been scraped yet. Go to the Jobs page and browse a country to start collecting data."}
            </p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <StatCard icon={Briefcase} label="Total Providers" value={stats.totalJobs} delay={0} />
              <StatCard icon={Globe} label="Countries" value={stats.activeCountries} delay={0.1} />
              <StatCard icon={Radio} label="Sources" value={stats.activeSources} delay={0.2} />
              <StatCard icon={TrendingUp} label="Top Category" value={stats.topCategory} delay={0.3} />
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
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Providers by Country</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.jobsByCountry}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-fg)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-fg)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--card-border)",
                          borderRadius: 12,
                          fontSize: 12,
                          color: "var(--foreground)",
                        }}
                      />
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
                  className="card p-6"
                >
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Providers by Category</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.jobsByCategory.slice(0, 8)}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                        nameKey="name"
                        label={({ name }) => name}
                        labelLine={false}
                        fontSize={10}
                        fill="var(--foreground)"
                      >
                        {stats.jobsByCategory.slice(0, 8).map((_, i) => (
                          <Cell key={i} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--card-border)",
                          borderRadius: 12,
                          fontSize: 12,
                          color: "var(--foreground)",
                        }}
                      />
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
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Providers Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.jobsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-fg)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-fg)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--card-border)",
                          borderRadius: 12,
                          fontSize: 12,
                          color: "var(--foreground)",
                        }}
                      />
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
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Listings by Source</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.jobsBySource} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-fg)" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} stroke="var(--muted-fg)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--card-border)",
                          borderRadius: 12,
                          fontSize: 12,
                          color: "var(--foreground)",
                        }}
                      />
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
                    <Building2 className="h-4 w-4 text-indigo-600 dark:text-amber-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top Companies</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.topCompanies}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-fg)" angle={-25} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-fg)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--card-border)",
                          borderRadius: 12,
                          fontSize: 12,
                          color: "var(--foreground)",
                        }}
                      />
                      <Bar dataKey="count" fill={primaryColor} radius={[4, 4, 0, 0]}>
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Market Intelligence</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Provider demand analysis, salary benchmarks, and geographic breakdown.</p>
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
                    <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-amber-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Service Demand Ranking</h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">Which services are most in demand</span>
                  </div>
                  <ResponsiveContainer width="100%" height={Math.max(300, stats.demandRanking.length * 28)}>
                    <BarChart data={stats.demandRanking} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-fg)" />
                      <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={140} stroke="var(--muted-fg)" />
                      <Tooltip
                        formatter={(value, _name, props) => {
                          const pct = (props.payload as { percentage?: number })?.percentage ?? 0;
                          return [`${value} jobs (${pct}%)`, "Count"];
                        }}
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--card-border)",
                          borderRadius: 12,
                          fontSize: 12,
                          color: "var(--foreground)",
                        }}
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
                  className="card p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-indigo-600 dark:text-amber-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Providers by City</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.jobsByCity.slice(0, 8)}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                        fontSize={10}
                        fill="var(--foreground)"
                      >
                        {stats.jobsByCity.slice(0, 8).map((_, i) => (
                          <Cell key={i} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--card-border)",
                          borderRadius: 12,
                          fontSize: 12,
                          color: "var(--foreground)",
                        }}
                      />
                    </PieChart>
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
                    <DollarSign className="h-4 w-4 text-indigo-600 dark:text-amber-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Salary Ranges by Service</h3>
                  </div>
                  <div className="overflow-y-auto max-h-[300px]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white dark:bg-gray-900">
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 font-medium text-gray-500 dark:text-gray-400">Service</th>
                          <th className="text-right py-2 font-medium text-gray-500 dark:text-gray-400">Min</th>
                          <th className="text-right py-2 font-medium text-gray-500 dark:text-gray-400">Avg</th>
                          <th className="text-right py-2 font-medium text-gray-500 dark:text-gray-400">Max</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.salaryByCategory.map((row) => (
                          <tr key={row.category} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2 text-gray-900 dark:text-gray-200 capitalize">{row.category}</td>
                            <td className="py-2 text-right text-gray-600 dark:text-gray-400">{row.currency} {row.min?.toLocaleString()}</td>
                            <td className="py-2 text-right font-medium text-green-600 dark:text-green-400">{row.currency} {row.avg?.toLocaleString()}</td>
                            <td className="py-2 text-right text-gray-600 dark:text-gray-400">{row.currency} {row.max?.toLocaleString()}</td>
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
                    <Building2 className="h-4 w-4 text-indigo-600 dark:text-amber-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Provider Landscape by Service</h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">Top companies per category</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
                    {stats.companiesByCategory.slice(0, 12).map((cat) => (
                      <div key={cat.category} className="rounded-xl bg-gray-50 dark:bg-white/5 p-3">
                        <h4 className="text-xs font-semibold text-indigo-600 dark:text-amber-400 uppercase tracking-wider mb-2 capitalize">{cat.category}</h4>
                        <ul className="space-y-1">
                          {cat.companies.map((company) => (
                            <li key={company.name} className="flex justify-between text-xs">
                              <span className="text-gray-700 dark:text-gray-300 truncate mr-2">{company.name}</span>
                              <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{company.count}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
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
