"use client";

import React, { useEffect, useState } from "react";
import { getAnalytics, AnalyticsData } from "@/lib/api";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalyticsData() {
      setLoading(true);
      setError(null);
      try {
        const res = await getAnalytics();
        setData(res);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
        setError(err instanceof Error ? err.message : "Failed to load analytics metrics.");
      } finally {
        setLoading(false);
      }
    }
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
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      <header className="pb-4 border-b border-slate-800 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-purple-400 tracking-tight flex items-center gap-2.5">
            <svg className="w-8 h-8 text-purple-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            SwarmRescue AI Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time emergency triage metrics, dispatch duration averages, and swarm unit utilization rates.
          </p>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-red-950/80 border border-red-800 rounded-2xl text-xs text-red-300 font-medium">
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
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Emergency Requests</p>
              <div className="text-3xl font-extrabold text-slate-100">{data?.total_requests || 0}</div>
              <p className="text-[11px] text-emerald-400 font-medium">{data?.resolved_requests || 0} marked resolved</p>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Triage → Assignment</p>
              <div className="text-3xl font-extrabold text-blue-400">{data?.avg_time_creation_to_assignment || 0} <span className="text-sm font-normal text-slate-400">mins</span></div>
              <p className="text-[11px] text-slate-500">From submission to dispatch</p>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Assignment → Resolution</p>
              <div className="text-3xl font-extrabold text-emerald-400">{data?.avg_time_assignment_to_resolution || 0} <span className="text-sm font-normal text-slate-400">mins</span></div>
              <p className="text-[11px] text-slate-500">Field response to incident resolution</p>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resource Utilization Rate</p>
              <div className="text-3xl font-extrabold text-purple-400">{data?.resource_utilization_pct || 0}%</div>
              <p className="text-[11px] text-slate-500">Active units currently dispatched</p>
            </div>
          </>
        )}
      </div>

      {/* Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              Incidents Breakdown by Category
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Distribution of emergency requests across primary incident types.</p>
          </div>

          {loading ? (
            <div className="h-64 bg-slate-950 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-500">
              Rendering category chart...
            </div>
          ) : categoryChartData.length === 0 ? (
            <div className="h-64 bg-slate-950 rounded-xl flex items-center justify-center text-xs text-slate-500">
              No category data available.
            </div>
          ) : (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || "#8b5cf6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Severity Breakdown Bar Chart */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              Incidents Breakdown by Severity
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Triage severity classification generated by LLM multi-agent engine.</p>
          </div>

          {loading ? (
            <div className="h-64 bg-slate-950 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-500">
              Rendering severity chart...
            </div>
          ) : severityChartData.length === 0 ? (
            <div className="h-64 bg-slate-950 rounded-xl flex items-center justify-center text-xs text-slate-500">
              No severity data available.
            </div>
          ) : (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || "#ef4444"} />
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
