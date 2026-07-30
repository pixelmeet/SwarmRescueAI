"use client";

import React, { useState } from "react";
import {
  EmergencyRequestResponse,
  RequestRecommendations,
  RecommendationCandidate,
  ResourceType,
  AssignmentResponse,
  AssignmentStatus,
} from "@/lib/api";

export interface AssignmentCardProps {
  // Admin Dispatch Mode props
  selectedRequest?: EmergencyRequestResponse | null;
  recommendations?: RequestRecommendations;
  loadingRecs?: boolean;
  recError?: string | null;
  onAssign?: (candidate: RecommendationCandidate, resourceType: ResourceType) => Promise<void>;
  dispatchStatus?: string | null;
  dispatchingId?: string | null;

  // Task Card / Responder Portal props
  assignment?: AssignmentResponse;
  title?: string;
  assignedTo?: string;
  resourceType?: ResourceType;
  status?: AssignmentStatus | string;
  etaMinutes?: number;
  onStatusChange?: (id: string, newStatus: AssignmentStatus) => void;
}

export function AssignmentCard({
  selectedRequest,
  recommendations,
  loadingRecs = false,
  recError = null,
  onAssign,
  dispatchStatus = null,
  dispatchingId = null,

  assignment,
  title = "Emergency Rescue Task",
  assignedTo = "Unassigned Unit",
  status = "assigned",
  etaMinutes = 10,
  onStatusChange,
}: AssignmentCardProps) {
  const [internalDispatchingId, setInternalDispatchingId] = useState<string | null>(null);

  // If onAssign or recommendations is passed, render Admin Dispatch Panel mode
  if (onAssign || selectedRequest !== undefined) {
    if (!selectedRequest) {
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center justify-between">
            <span>Intelligent Resource Dispatch Engine</span>
          </h3>
          <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-400 text-xs space-y-2">
            <svg className="w-10 h-10 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
              />
            </svg>
            <p>Select an emergency incident from the queue to calculate AI recommendations and manual assignment.</p>
          </div>
        </div>
      );
    }

    const activeDispatchingId = dispatchingId !== null ? dispatchingId : internalDispatchingId;
    const currentRecs = recommendations || { rescue_teams: [], ambulances: [], hospitals: [], volunteers: [] };

    const handleAssignClick = async (candidate: RecommendationCandidate, type: ResourceType) => {
      setInternalDispatchingId(candidate.resource_id);
      try {
        if (onAssign) {
          await onAssign(candidate, type);
        }
      } finally {
        setInternalDispatchingId(null);
      }
    };

    const totalCandidates =
      (currentRecs.rescue_teams?.length || 0) +
      (currentRecs.ambulances?.length || 0) +
      (currentRecs.hospitals?.length || 0) +
      (currentRecs.volunteers?.length || 0);

    const renderSection = (
      secTitle: string,
      candidates: RecommendationCandidate[] = [],
      type: ResourceType,
      badgeColor: string,
      icon: string
    ) => {
      if (!candidates || candidates.length === 0) return null;

      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${badgeColor}`}></span>
              <span>{icon}</span> {secTitle} ({candidates.length})
            </span>
          </div>

          <div className="space-y-2">
            {candidates.map((cand, idx) => {
              const isAssigning = activeDispatchingId === cand.resource_id;
              const isAssigned = selectedRequest.status === "assigned";
              const matchPercentage = Math.round(cand.score * 100);

              return (
                <div
                  key={`${type}-${cand.resource_id}`}
                  className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 text-xs transition shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-900/60 text-blue-400 border border-blue-700/60 flex items-center justify-center font-bold text-xs shrink-0">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-slate-100">{cand.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-emerald-400 font-semibold">{cand.distance_km} km away</span>
                        <span>&bull;</span>
                        <span className="text-amber-400 font-medium">
                          ETA: {cand.eta_minutes !== null ? `${cand.eta_minutes} min` : "Calculating..."}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-blue-400">{matchPercentage}%</div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Match Score</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAssignClick(cand, type)}
                      disabled={isAssigning || isAssigned}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition shadow shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      {isAssigning ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Assigning...
                        </>
                      ) : isAssigned ? (
                        "Assigned"
                      ) : (
                        "Assign"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Intelligent Dispatch Panel
          </h3>
          <span className="text-xs font-mono text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
            ID: {selectedRequest.id.substring(0, 8)}...
          </span>
        </div>

        {/* Selected Request Banner */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              🚨 {selectedRequest.category} Incident
            </span>
            <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded text-[10px] uppercase font-bold">
              {selectedRequest.severity} Severity
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{selectedRequest.description}</p>
          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
            <span>Reporter: {selectedRequest.reporter_name}</span>
            <span className="font-mono text-slate-400">
              [{selectedRequest.location.coordinates[1].toFixed(3)}, {selectedRequest.location.coordinates[0].toFixed(3)}]
            </span>
          </div>
        </div>

        {/* Dispatch Status Notification */}
        {dispatchStatus && (
          <div className="p-3 bg-blue-950/90 border border-blue-600 rounded-xl text-xs text-blue-200 font-medium flex items-center gap-2 shadow-inner">
            <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{dispatchStatus}</span>
          </div>
        )}

        {/* Recommendations Engine List */}
        {loadingRecs ? (
          <div className="p-6 text-center text-xs text-slate-400 animate-pulse bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-center">
              <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
            <p>Computing optimal resource matches with Scoring Engine...</p>
          </div>
        ) : recError ? (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300">
            {recError}
          </div>
        ) : totalCandidates === 0 ? (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 text-center">
            No available resources matched for this request location/skills.
          </div>
        ) : (
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {renderSection("Rescue Teams", currentRecs.rescue_teams, "rescue_team", "bg-red-500", "🚒")}
            {renderSection("Ambulances", currentRecs.ambulances, "ambulance", "bg-orange-500", "🚑")}
            {renderSection("Hospitals", currentRecs.hospitals, "hospital", "bg-blue-500", "🏥")}
            {renderSection("Volunteers", currentRecs.volunteers, "volunteer", "bg-emerald-500", "🙋")}
          </div>
        )}
      </div>
    );
  }

  // Standalone Card mode (used in Responder Portal / Team Page)
  const currentStatus = assignment?.status || status;
  const currentAssignedTo = assignment ? `${assignment.resource_type}: ${assignment.resource_id}` : assignedTo;
  const currentEta = assignment?.eta_minutes ?? etaMinutes;

  const getStatusBadge = (st: string) => {
    switch (st.toLowerCase()) {
      case "en_route":
        return "bg-amber-600 text-white font-bold";
      case "completed":
        return "bg-emerald-600 text-white font-bold";
      case "cancelled":
        return "bg-slate-700 text-slate-400 font-medium";
      default:
        return "bg-blue-600 text-white font-bold";
    }
  };

  return (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-sm font-bold text-slate-100">{title}</h4>
          <p className="text-xs text-slate-400 mt-0.5">{currentAssignedTo}</p>
        </div>
        <span className={`text-[10px] px-2.5 py-1 rounded uppercase tracking-wider ${getStatusBadge(currentStatus)}`}>
          {currentStatus}
        </span>
      </div>

      <div className="flex justify-between items-center text-xs text-slate-300 pt-2 border-t border-slate-900">
        <span className="flex items-center gap-1 font-mono text-blue-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ETA: {currentEta} mins
        </span>

        {assignment && onStatusChange && (
          <select
            value={currentStatus}
            onChange={(e) => onStatusChange(assignment.id, e.target.value as AssignmentStatus)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="assigned">Assigned</option>
            <option value="en_route">En Route</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}
      </div>
    </div>
  );
}
