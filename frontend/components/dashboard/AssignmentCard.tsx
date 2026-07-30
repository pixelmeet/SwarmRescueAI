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
import { SeverityBadge, CategoryBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Loader2, Sparkles, Navigation, Clock } from "lucide-react";

export interface AssignmentCardProps {
  // Admin Dispatch Mode props
  selectedRequest?: EmergencyRequestResponse | null;
  recommendations?: RequestRecommendations;
  loadingRecs?: boolean;
  recError?: string | null;
  onAssign?: (
    candidate: RecommendationCandidate,
    resourceType: ResourceType
  ) => Promise<void>;
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
  const [internalDispatchingId, setInternalDispatchingId] = useState<string | null>(
    null
  );

  // Confirmation modal state
  const [pendingCandidate, setPendingCandidate] = useState<{
    candidate: RecommendationCandidate;
    type: ResourceType;
  } | null>(null);

  // If onAssign or selectedRequest is passed, render Admin Dispatch Panel mode
  if (onAssign || selectedRequest !== undefined) {
    if (!selectedRequest) {
      return (
        <div className="bg-surface-primary border border-[var(--border-primary)] rounded-card p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              AI Resource Dispatch Engine
            </span>
          </h3>
          <div className="p-8 border border-dashed border-slate-800 rounded-card text-center text-slate-400 text-xs space-y-2">
            <Navigation className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="font-medium text-slate-300">
              No incident selected
            </p>
            <p className="text-[11px] text-slate-500">
              Select an emergency incident from the queue to calculate AI scoring recommendations and dispatch resources.
            </p>
          </div>
        </div>
      );
    }

    const activeDispatchingId =
      dispatchingId !== null ? dispatchingId : internalDispatchingId;
    const currentRecs = recommendations || {
      rescue_teams: [],
      ambulances: [],
      hospitals: [],
      volunteers: [],
    };

    const handleConfirmDispatch = async () => {
      if (!pendingCandidate || !onAssign) return;
      const { candidate, type } = pendingCandidate;
      setPendingCandidate(null);
      setInternalDispatchingId(candidate.resource_id);
      try {
        await onAssign(candidate, type);
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
                  className="p-3 bg-surface-primary border border-[var(--border-primary)] hover:border-slate-700 rounded-card flex items-center justify-between gap-3 text-xs transition shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-900/60 text-blue-400 border border-blue-700/60 flex items-center justify-center font-bold text-xs shrink-0 font-telemetry">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-slate-100">{cand.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-telemetry">
                        <span className="text-emerald-400 font-semibold">
                          {cand.distance_km} km away
                        </span>
                        <span>&bull;</span>
                        <span className="text-amber-400 font-medium">
                          ETA:{" "}
                          {cand.eta_minutes !== null
                            ? `${cand.eta_minutes} min`
                            : "Calculating..."}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Score Bar */}
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-extrabold text-primary font-telemetry">
                        {matchPercentage}%
                      </div>
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${matchPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <Button
                      variant={isAssigned ? "secondary" : "primary"}
                      size="sm"
                      onClick={() =>
                        setPendingCandidate({ candidate: cand, type })
                      }
                      loading={isAssigning}
                      disabled={isAssigned}
                    >
                      {isAssigned ? "Assigned" : "Assign"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div className="bg-surface-primary border border-[var(--border-primary)] rounded-card p-5 shadow-xl space-y-4">
        {/* Dispatch Confirmation Modal */}
        <ConfirmModal
          isOpen={!!pendingCandidate}
          title="Confirm Operational Dispatch"
          description="Dispatching this resource will lock assignment and notify the field responder team."
          details={{
            resourceName: pendingCandidate?.candidate.name,
            requestDescription: selectedRequest.description,
            eta: pendingCandidate?.candidate.eta_minutes,
          }}
          confirmText="Dispatch Unit"
          onConfirm={handleConfirmDispatch}
          onCancel={() => setPendingCandidate(null)}
        />

        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            AI Dispatch Recommendation Engine
          </h3>
          <span className="text-xs font-mono text-primary bg-primary-muted px-2 py-0.5 rounded border border-blue-800">
            ID: {selectedRequest.id.substring(0, 8)}...
          </span>
        </div>

        {/* Selected Request Banner */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-card space-y-2">
          <div className="flex justify-between items-center text-xs">
            <CategoryBadge category={selectedRequest.category as any} size="xs" />
            <SeverityBadge
              severity={selectedRequest.severity as any}
              pulse={true}
              size="xs"
            />
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {selectedRequest.description}
          </p>
          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 font-mono">
            <span>Reporter: {selectedRequest.reporter_name}</span>
            <span>
              [{selectedRequest.location.coordinates[1].toFixed(3)},{" "}
              {selectedRequest.location.coordinates[0].toFixed(3)}]
            </span>
          </div>
        </div>

        {/* Dispatch Status Notification */}
        {dispatchStatus && (
          <div className="p-3 bg-blue-950/90 border border-blue-600 rounded-card text-xs text-blue-200 font-medium flex items-center gap-2 shadow-inner">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{dispatchStatus}</span>
          </div>
        )}

        {/* Recommendations Engine List */}
        {loadingRecs ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-950 rounded-card border border-slate-800 space-y-2">
            <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
            <p>Computing optimal weighted score matches with Scoring Engine...</p>
          </div>
        ) : recError ? (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-card text-xs text-red-300">
            {recError}
          </div>
        ) : totalCandidates === 0 ? (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-card text-xs text-slate-400 text-center">
            No available resources matched for this request location/skills.
          </div>
        ) : (
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
            {renderSection(
              "Rescue Teams",
              currentRecs.rescue_teams,
              "rescue_team",
              "bg-blue-500",
              "🚒"
            )}
            {renderSection(
              "Ambulances",
              currentRecs.ambulances,
              "ambulance",
              "bg-red-500",
              "🚑"
            )}
            {renderSection(
              "Hospitals",
              currentRecs.hospitals,
              "hospital",
              "bg-emerald-500",
              "🏥"
            )}
            {renderSection(
              "Volunteers",
              currentRecs.volunteers,
              "volunteer",
              "bg-amber-500",
              "🙋"
            )}
          </div>
        )}
      </div>
    );
  }

  // Standalone Card mode (used in Responder Portal / Team Page)
  const currentStatus = assignment?.status || status;
  const currentAssignedTo = assignment
    ? `${assignment.resource_type}: ${assignment.resource_id}`
    : assignedTo;
  const currentEta = assignment?.eta_minutes ?? etaMinutes;

  return (
    <div className="p-4 bg-surface-primary border border-[var(--border-primary)] rounded-card space-y-3 shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-sm font-bold text-slate-100">{title}</h4>
          <p className="text-xs text-slate-400 mt-0.5">{currentAssignedTo}</p>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-badge uppercase tracking-wider font-bold bg-blue-950/80 text-blue-400 border border-blue-800">
          {currentStatus}
        </span>
      </div>

      <div className="flex justify-between items-center text-xs text-slate-300 pt-2 border-t border-slate-900 font-telemetry">
        <span className="flex items-center gap-1 text-primary">
          <Clock className="w-3.5 h-3.5" />
          ETA: {currentEta} mins
        </span>

        {assignment && onStatusChange && (
          <select
            value={currentStatus}
            onChange={(e) =>
              onStatusChange(assignment.id, e.target.value as AssignmentStatus)
            }
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
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
