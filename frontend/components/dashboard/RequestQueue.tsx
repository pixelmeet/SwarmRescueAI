"use client";

import React, { useEffect, useState } from "react";
import { listRequests, EmergencyRequestResponse, RequestStatus, Severity } from "@/lib/api";

interface RequestQueueProps {
  onSelectRequest?: (request: EmergencyRequestResponse) => void;
  selectedRequestId?: string | null;
}

export function RequestQueue({ onSelectRequest, selectedRequestId }: RequestQueueProps) {
  const [requests, setRequests] = useState<EmergencyRequestResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRequests();
      setRequests(data);
    } catch (err) {
      console.error("Failed to load request queue:", err);
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = requests.filter((req) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return req.status === "pending";
    if (statusFilter === "assigned") return req.status === "assigned";
    if (statusFilter === "critical") return req.severity === "critical";
    return true;
  });

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-600 text-white font-bold animate-pulse";
      case "high":
        return "bg-orange-600 text-white font-bold";
      case "medium":
        return "bg-amber-600 text-white font-medium";
      case "low":
        return "bg-emerald-600 text-white font-medium";
      default:
        return "bg-slate-700 text-slate-200";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          Live Incident Queue ({filteredRequests.length})
        </h3>
        <button
          onClick={loadRequests}
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition"
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
            onClick={() => setStatusFilter(filter)}
            className={`px-2.5 py-1 rounded-md font-semibold capitalize transition ${
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
      {loading ? (
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 text-center animate-pulse">
          Loading live incident stream...
        </div>
      ) : error ? (
        <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-300">
          {error}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 text-center">
          No emergency requests found for selected filter.
        </div>
      ) : (
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {filteredRequests.map((req) => {
            const isSelected = selectedRequestId === req.id;
            return (
              <div
                key={req.id}
                onClick={() => onSelectRequest && onSelectRequest(req)}
                className={`p-3.5 bg-slate-950 border rounded-lg transition cursor-pointer space-y-2 ${
                  isSelected
                    ? "border-blue-500 ring-1 ring-blue-500 bg-slate-900"
                    : "border-slate-800 hover:border-slate-700"
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
                    <span className="px-2 py-0.5 text-[10px] bg-slate-900 border border-slate-700 text-slate-400 rounded uppercase">
                      {req.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {req.id.substring(0, 8)}...
                  </span>
                </div>

                <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed font-medium">
                  {req.description}
                </p>

                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                  <span>Reporter: {req.reporter_name || "Anonymous"}</span>
                  <span className="font-mono text-slate-500">
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
