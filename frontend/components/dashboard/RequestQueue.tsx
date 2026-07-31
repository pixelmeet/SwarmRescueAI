"use client";

import React, { useEffect, useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { listRequests, EmergencyRequestResponse, Severity } from "@/lib/api";
import { QueueSkeleton } from "@/components/ui/Skeleton";
import {
  SeverityBadge,
  CategoryBadge,
  RequestStatusBadge,
} from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

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
  const [internalRequests, setInternalRequests] = useState<
    EmergencyRequestResponse[]
  >([]);
  const [internalLoading, setInternalLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  // Filter pending or assigned requests & sort newest first
  const sortedAndFilteredRequests = [...requestsSource]
    .filter((req) => req.status === "pending" || req.status === "assigned")
    .filter((req) => {
      if (statusFilter === "pending") return req.status === "pending";
      if (statusFilter === "assigned") return req.status === "assigned";
      if (statusFilter === "critical") return req.severity === "critical";
      return true;
    })
    .filter((req) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        req.description.toLowerCase().includes(q) ||
        (req.reporter_name && req.reporter_name.toLowerCase().includes(q)) ||
        req.category.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

  return (
    <div className="space-y-3 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Incident Queue ({sortedAndFilteredRequests.length})
        </h3>
        <button
          type="button"
          onClick={loadRequests}
          className="text-xs text-primary hover:text-primary-hover font-semibold flex items-center gap-1 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
        <input
          type="text"
          placeholder="Search incidents or reporters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-surface-primary border border-[var(--border-primary)] rounded-button text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
        {["all", "pending", "assigned", "critical"].map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`px-2.5 py-1 rounded-badge text-[11px] font-bold capitalize transition cursor-pointer ${
              statusFilter === filter
                ? "bg-primary text-white shadow-sm"
                : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading && sortedAndFilteredRequests.length === 0 ? (
        <QueueSkeleton count={3} />
      ) : error ? (
        <EmptyState
          icon="error"
          title="Incident Queue Error"
          description={error}
          actionLabel="Retry Loading"
          onAction={loadRequests}
        />
      ) : sortedAndFilteredRequests.length === 0 ? (
        <EmptyState
          icon="clear"
          title="All clear — no pending incidents"
          description="All emergency requests for this filter have been dispatched or resolved."
        />
      ) : (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
          {sortedAndFilteredRequests.map((req) => {
            const isSelected = selectedRequestId === req.id;
            return (
              <div
                key={req.id}
                onClick={() => onSelectRequest && onSelectRequest(req)}
                className={`p-3.5 rounded-card border transition cursor-pointer space-y-2 ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/40 bg-surface-primary shadow-lg"
                    : "bg-surface-primary/60 border-[var(--border-primary)] hover:border-slate-600 hover:bg-surface-primary"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <SeverityBadge severity={req.severity as Severity} pulse={true} size="xs" />
                    <CategoryBadge category={req.category as any} size="xs" />
                    <RequestStatusBadge status={req.status as any} size="xs" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-telemetry font-medium">
                    {getTimeAgo(req.created_at)}
                  </span>
                </div>

                <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed font-medium">
                  {req.description}
                </p>

                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80 font-mono">
                  <span className="truncate max-w-[150px]">
                    Reporter: {req.reporter_name || "Anonymous"}
                  </span>
                  <span className="text-slate-500 shrink-0">
                    [{req.location.coordinates[1].toFixed(3)},{" "}
                    {req.location.coordinates[0].toFixed(3)}]
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
