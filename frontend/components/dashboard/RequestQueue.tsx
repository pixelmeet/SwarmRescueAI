"use client";

import React, { useEffect, useState } from "react";
import { listRequests, EmergencyRequestResponse, Severity } from "@/lib/api";

interface RequestQueueProps {
  onSelectRequest?: (request: EmergencyRequestResponse) => void;
  selectedRequestId?: string | null;
  requests?: EmergencyRequestResponse[];
  loading?: boolean;
  onRefresh?: () => void;
}

function getTimeAgo(dateString?: string): string {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recently";
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RequestQueue({
  onSelectRequest,
  selectedRequestId,
  requests: propsRequests,
  loading: propsLoading,
  onRefresh,
}: RequestQueueProps) {
  const [internalRequests, setInternalRequests] = useState<EmergencyRequestResponse[]>([]);
  const [internalLoading, setInternalLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadRequests = async () => {
    if (onRefresh) {
      onRefresh();
      return;
    }
    setInternalLoading(true);
    setError(null);
    try {
      const data = await listRequests();
      setInternalRequests(data);
    } catch (err) {
      console.error("Failed to load request queue:", err);
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    if (!propsRequests) {
      loadRequests();
    }
  }, [propsRequests]);

  const requestsSource = propsRequests || internalRequests;
  const loading = propsLoading !== undefined ? propsLoading : internalLoading;

  // Filter pending or assigned requests (or based on active chip) & sort newest first
  const sortedAndFilteredRequests = [...requestsSource]
    .filter((req) => req.status === "pending" || req.status === "assigned")
    .filter((req) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "pending") return req.status === "pending";
      if (statusFilter === "assigned") return req.status === "assigned";
      if (statusFilter === "critical") return req.severity === "critical";
      return true;
    })
    .sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-600 text-white font-bold animate-pulse shadow-red-900/50 shadow";
      case "high":
        return "bg-orange-500 text-white font-bold";
      case "medium":
        return "bg-yellow-500 text-slate-950 font-bold";
      case "low":
        return "bg-blue-600 text-white font-medium";
      default:
        return "bg-slate-700 text-slate-200";
    }
  };

  return (
    <div className="space-y-3 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          Emergency Incident Queue ({sortedAndFilteredRequests.length})
        </h3>
        <button
          type="button"
          onClick={loadRequests}
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
        {["all", "pending", "assigned", "critical"].map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`px-2.5 py-1 rounded-md font-semibold capitalize transition cursor-pointer ${
              statusFilter === filter
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading && sortedAndFilteredRequests.length === 0 ? (
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 text-center animate-pulse">
          Loading live incident stream...
        </div>
      ) : error ? (
        <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-300">
          {error}
        </div>
      ) : sortedAndFilteredRequests.length === 0 ? (
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 text-center">
          No emergency requests found matching selected filter.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {sortedAndFilteredRequests.map((req) => {
            const isSelected = selectedRequestId === req.id;
            return (
              <div
                key={req.id}
                onClick={() => onSelectRequest && onSelectRequest(req)}
                className={`p-3.5 rounded-xl border transition cursor-pointer space-y-2 ${
                  isSelected
                    ? "border-blue-500 ring-2 ring-blue-500/40 bg-slate-900 shadow-lg"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 text-[10px] rounded uppercase ${getSeverityBadge(req.severity)}`}>
                      {req.severity}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded font-semibold uppercase">
                      {req.category}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] rounded uppercase font-semibold border ${
                      req.status === "pending"
                        ? "bg-amber-950/80 text-amber-400 border-amber-800"
                        : "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-medium">
                    {getTimeAgo(req.created_at)}
                  </span>
                </div>

                <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed font-medium">
                  {req.description}
                </p>

                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
                  <span className="truncate max-w-[160px]">
                    Reporter: {req.reporter_name || "Anonymous"}
                  </span>
                  <span className="font-mono text-slate-500 shrink-0">
                    [{req.location.coordinates[1].toFixed(3)}, {req.location.coordinates[0].toFixed(3)}]
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

