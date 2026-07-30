"use client";

import React, { useEffect, useState } from "react";
import { StatsPanel } from "@/components/dashboard/StatsPanel";
import { listRequests, EmergencyRequestResponse } from "@/lib/api";

export default function AnalyticsDashboardPage() {
  const [requests, setRequests] = useState<EmergencyRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await listRequests();
        setRequests(data);
      } catch (err) {
        console.error("Analytics load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categoryCounts = requests.reduce<Record<string, number>>((acc, req) => {
    const cat = req.category || "other";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const severityCounts = requests.reduce<Record<string, number>>((acc, req) => {
    const sev = req.severity || "medium";
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 bg-slate-950 min-h-screen text-slate-100">
      <header className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-extrabold text-purple-400">Response & Incident Analytics</h1>
        <p className="text-slate-400 text-xs mt-1">Real-time incident distribution, severity metrics, and swarm performance stats.</p>
      </header>

      <StatsPanel />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Incidents by Category</h3>
          {loading ? (
            <p className="text-xs text-slate-400 animate-pulse">Analyzing category distribution...</p>
          ) : Object.keys(categoryCounts).length === 0 ? (
            <p className="text-xs text-slate-400">No incident data available.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="capitalize text-slate-300">{cat}</span>
                    <span className="text-purple-400">{count} ({Math.round((count / requests.length) * 100)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${(count / requests.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Severity Breakdown */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Incidents by Severity</h3>
          {loading ? (
            <p className="text-xs text-slate-400 animate-pulse">Analyzing severity metrics...</p>
          ) : Object.keys(severityCounts).length === 0 ? (
            <p className="text-xs text-slate-400">No incident data available.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(severityCounts).map(([sev, count]) => (
                <div key={sev} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="uppercase text-slate-300">{sev}</span>
                    <span className="text-red-400">{count} ({Math.round((count / requests.length) * 100)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${(count / requests.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
