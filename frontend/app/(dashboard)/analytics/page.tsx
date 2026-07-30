"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, RefreshCw, Clock, CheckCircle2, Activity, PieChart as PieIcon } from "lucide-react";
import { getAnalytics, AnalyticsData } from "@/lib/api";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAnalytics();
      setData(res);
    } catch (err) {
      console.error("Failed to load analytics data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load analytics metrics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const categoryChartData = data
    ? Object.entries(data.request_count_by_category).map(([name, count]) => ({
        name: name.toUpperCase(),
        count,
      }))
    : [];

  const severityChartData = data
    ? Object.entries(data.request_count_by_severity).map(([name, count]) => ({
        name: name.toUpperCase(),
        count,
      }))
    : [];

  // Compute Client-Side Resolution Rate Donut Chart Data
  const totalRequests = data?.total_requests || 0;
  const resolvedRequests = data?.resolved_requests || 0;
  const activeRequests = Math.max(0, totalRequests - resolvedRequests);
  const resolutionRatePct =
    totalRequests > 0 ? Math.round((resolvedRequests / totalRequests) * 100) : 0;

  const resolutionDonutData = [
    { name: "Resolved Incidents", value: resolvedRequests, color: "#10b981" },
    { name: "Active / Pending", value: activeRequests, color: "#3b82f6" },
  ];

  const CATEGORY_COLORS: Record<string, string> = {
    FIRE: "#ef4444",
    MEDICAL: "#3b82f6",
    TRAPPED: "#f59e0b",
    FLOOD: "#06b6d4",
    OTHER: "#8b5cf6",
  };

  const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: "#dc2626",
    HIGH: "#f97316",
    MEDIUM: "#eab308",
    LOW: "#3b82f6",
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 bg-background min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <header className="pb-4 border-b border-[var(--border-primary)] flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-violet-400 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-8 h-8 text-violet-500 shrink-0" />
            SwarmRescue AI Operational Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time emergency triage metrics, dispatch duration averages, and swarm unit utilization rates.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={loadAnalyticsData}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
        >
          Refresh Metrics
        </Button>
      </header>

      {error && (
        <div className="p-4 bg-red-950/80 border border-red-800 rounded-card text-xs text-red-300 font-medium">
          {error}
        </div>
      )}

      {/* Top Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="p-5 bg-surface-primary border border-[var(--border-primary)] rounded-card shadow-xl space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Emergency Requests
              </p>
              <div className="text-3xl font-extrabold text-slate-100 font-telemetry">
                {totalRequests}
              </div>
              <p className="text-[11px] text-emerald-400 font-medium font-telemetry flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {resolvedRequests} marked resolved
              </p>
            </div>

            <div className="p-5 bg-surface-primary border border-[var(--border-primary)] rounded-card shadow-xl space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Avg Triage &rarr; Assignment
              </p>
              <div className="text-3xl font-extrabold text-blue-400 font-telemetry">
                {data?.avg_time_creation_to_assignment || 0}{" "}
                <span className="text-sm font-normal text-slate-400">mins</span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-primary" />
                Submission to resource dispatch
              </p>
            </div>

            <div className="p-5 bg-surface-primary border border-[var(--border-primary)] rounded-card shadow-xl space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Avg Assignment &rarr; Resolution
              </p>
              <div className="text-3xl font-extrabold text-emerald-400 font-telemetry">
                {data?.avg_time_assignment_to_resolution || 0}{" "}
                <span className="text-sm font-normal text-slate-400">mins</span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Field arrival to incident resolution
              </p>
            </div>

            <div className="p-5 bg-surface-primary border border-[var(--border-primary)] rounded-card shadow-xl space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Resource Utilization Rate
              </p>
              <div className="text-3xl font-extrabold text-violet-400 font-telemetry">
                {data?.resource_utilization_pct || 0}%
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                <Activity className="w-3 h-3 text-violet-400" />
                {data?.active_resources_count || 0} active units dispatched
              </p>
            </div>
          </>
        )}
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart: Resolution Rate (Client-Side Computed) */}
        <div className="p-6 rounded-card border border-[var(--border-primary)] bg-surface-primary shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              Incident Resolution Rate
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Client-side ratio of resolved vs active emergency requests.
            </p>
          </div>

          {loading ? (
            <div className="h-64 bg-slate-950 rounded-card animate-pulse flex items-center justify-center text-xs text-slate-500">
              Computing resolution rate...
            </div>
          ) : totalRequests === 0 ? (
            <EmptyState
              icon="empty"
              title="No Incident Data"
              description="Submit emergency reports to view resolution analytics."
            />
          ) : (
            <div className="h-64 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resolutionDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {resolutionDonutData.map((entry, index) => (
                      <Cell key={`donut-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#f8fafc",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs text-slate-300 font-medium">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Ring Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-6">
                <span className="text-2xl font-black text-emerald-400 font-telemetry">
                  {resolutionRatePct}%
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Resolved
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="p-6 rounded-card border border-[var(--border-primary)] bg-surface-primary shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
              Breakdown by Category
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Distribution of emergency requests across primary incident types.
            </p>
          </div>

          {loading ? (
            <div className="h-64 bg-slate-950 rounded-card animate-pulse flex items-center justify-center text-xs text-slate-500">
              Rendering category chart...
            </div>
          ) : categoryChartData.length === 0 ? (
            <EmptyState
              icon="empty"
              title="No Category Data"
              description="No category distribution records found."
            />
          ) : (
            <div className="h-64 w-full pt-2 font-telemetry">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#f8fafc",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell
                        key={`cell-cat-${index}`}
                        fill={CATEGORY_COLORS[entry.name] || "#8b5cf6"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Severity Breakdown Bar Chart */}
        <div className="p-6 rounded-card border border-[var(--border-primary)] bg-surface-primary shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              Breakdown by Severity
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Triage severity classification generated by LLM multi-agent engine.
            </p>
          </div>

          {loading ? (
            <div className="h-64 bg-slate-950 rounded-card animate-pulse flex items-center justify-center text-xs text-slate-500">
              Rendering severity chart...
            </div>
          ) : severityChartData.length === 0 ? (
            <EmptyState
              icon="empty"
              title="No Severity Data"
              description="No severity distribution records found."
            />
          ) : (
            <div className="h-64 w-full pt-2 font-telemetry">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={severityChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#f8fafc",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {severityChartData.map((entry, index) => (
                      <Cell
                        key={`cell-sev-${index}`}
                        fill={SEVERITY_COLORS[entry.name] || "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
