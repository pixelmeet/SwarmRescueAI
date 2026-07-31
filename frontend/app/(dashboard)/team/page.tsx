"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Users, Truck, CheckCircle2, Navigation, RefreshCw, Clock, MapPin } from "lucide-react";
import {
  listAssignments,
  listRequests,
  listTeams,
  listAmbulances,
  listVolunteers,
  updateAssignmentStatus,
  AssignmentResponse,
  EmergencyRequestResponse,
  RescueTeam,
  Ambulance,
  Volunteer,
  AssignmentStatus,
} from "@/lib/api";
import { socketClient } from "@/lib/socket";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { SeverityBadge, CategoryBadge, RequestStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";

interface UnifiedResource {
  id: string;
  name: string;
  type: string;
  kind: "rescue_team" | "ambulance" | "volunteer";
  accessCode?: string;
}

function TeamDashboardContent() {
  const searchParams = useSearchParams();
  const initialResourceId = searchParams.get("resource_id") || "";

  const [resources, setResources] = useState<UnifiedResource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>(initialResourceId);

  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [requests, setRequests] = useState<EmergencyRequestResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load available field resources for selector dropdown
  useEffect(() => {
    async function loadResources() {
      try {
        const [tList, aList, vList] = await Promise.all([
          listTeams().catch(() => []),
          listAmbulances().catch(() => []),
          listVolunteers().catch(() => []),
        ]);

        const unified: UnifiedResource[] = [
          ...tList.map((t: RescueTeam) => ({
            id: t.id,
            name: t.name,
            type: t.type,
            kind: "rescue_team" as const,
            accessCode: t.access_code,
          })),
          ...aList.map((a: Ambulance) => ({
            id: a.id,
            name: `Ambulance — ${a.driver_name}`,
            type: a.plate_number,
            kind: "ambulance" as const,
            accessCode: a.access_code,
          })),
          ...vList.map((v: Volunteer) => ({
            id: v.id,
            name: `Volunteer — ${v.name}`,
            type: v.email,
            kind: "volunteer" as const,
            accessCode: v.access_code,
          })),
        ];

        setResources(unified);

        if (!selectedResourceId && unified.length > 0) {
          setSelectedResourceId(unified[0].id);
        }
      } catch (err) {
        console.error("Error loading roster resources:", err);
      }
    }
    loadResources();
  }, []);

  // Load assignments for selected resource & all emergency requests
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [assignList, reqList] = await Promise.all([
        listAssignments(selectedResourceId || undefined).catch(() => []),
        listRequests().catch(() => []),
      ]);
      setAssignments(assignList);
      setRequests(reqList);
    } catch (err) {
      console.error("Error loading team assignments:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedResourceId]);

  useEffect(() => {
    loadData();

    socketClient.connect();
    const unsubAssign = socketClient.subscribe("new_assignment", () => loadData());
    const unsubStatus = socketClient.subscribe("status_update", () => loadData());
    const unsubRes = socketClient.subscribe("resource_update", () => loadData());

    return () => {
      unsubAssign();
      unsubStatus();
      unsubRes();
    };
  }, [loadData]);

  // Handle assignment status transition (en_route -> completed)
  const handleStatusUpdate = async (
    assignmentId: string,
    newStatus: AssignmentStatus,
    targetResourceId: string
  ) => {
    setUpdatingId(assignmentId);

    try {
      const res = resources.find((r) => r.id === targetResourceId);
      await updateAssignmentStatus(assignmentId, newStatus, targetResourceId, res?.accessCode);

      const statusText =
        newStatus === "en_route"
          ? "En Route to Incident Location"
          : "Completed & Incident Resolved";

      addToast("success", "Status Updated", statusText);

      // Optimistic update
      setAssignments((prev) =>
        prev.map((a) => (a.id === assignmentId ? { ...a, status: newStatus } : a))
      );

      await loadData();
    } catch (err) {
      console.error("Failed to update status:", err);
      addToast(
        "error",
        "Update Failed",
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const activeResource = resources.find((r) => r.id === selectedResourceId);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 bg-background min-h-screen text-slate-100 font-sans">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[var(--border-primary)] gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-400 tracking-tight flex items-center gap-2.5">
            <Users className="w-8 h-8 text-emerald-500 shrink-0" />
            Field Responder Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Task execution view for teams, ambulances, and volunteers to update dispatch status.
          </p>
        </div>

        {/* Resource Picker */}
        <div className="bg-surface-primary border border-[var(--border-primary)] p-2.5 rounded-card flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">
            Active Unit:
          </label>
          <select
            value={selectedResourceId}
            onChange={(e) => setSelectedResourceId(e.target.value)}
            className="bg-slate-950 text-emerald-400 text-xs font-bold border border-slate-800 rounded-button px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="">All Field Dispatches</option>
            {resources.map((res) => (
              <option key={res.id} value={res.id}>
                {res.name} ({res.type})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Assigned Tasks Grid */}
      <div className="bg-surface-primary border border-[var(--border-primary)] rounded-card p-5 md:p-6 shadow-xl space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Assigned Field Tasks ({assignments.length})
            {activeResource && (
              <span className="text-xs text-emerald-400 normal-case font-medium">
                for {activeResource.name}
              </span>
            )}
          </h3>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : assignments.length === 0 ? (
          <EmptyState
            icon="clear"
            title="No Active Dispatches"
            description="This unit has no pending emergency assignments at present."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((assignment) => {
              const req = requests.find((r) => r.id === assignment.request_id);
              const isUpdating = updatingId === assignment.id;

              return (
                <div
                  key={assignment.id}
                  className="bg-slate-950 border border-slate-800 rounded-card p-5 space-y-4 shadow-lg hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {req && <CategoryBadge category={req.category} size="xs" />}
                        {req && <SeverityBadge severity={req.severity} size="xs" />}
                      </div>

                      <RequestStatusBadge status={assignment.status as any} size="xs" />
                    </div>

                    {req && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-200 font-medium leading-relaxed">
                          {req.description}
                        </p>

                        <div className="text-[11px] text-slate-400 space-y-1.5 pt-2.5 border-t border-slate-900 font-mono">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Reporter:</span>
                            <span className="text-slate-300">
                              {req.reporter_name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-red-400" /> Coordinates:
                            </span>
                            <span className="text-slate-300 font-telemetry">
                              [{req.location.coordinates[1].toFixed(4)},{" "}
                              {req.location.coordinates[0].toFixed(4)}]
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-primary" /> Est. ETA:
                            </span>
                            <span className="text-emerald-400 font-bold font-telemetry">
                              {assignment.eta_minutes || 10} min
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Progression Workflow Step Indicator */}
                  <div className="pt-3 border-t border-slate-900 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span
                        className={
                          assignment.status === "assigned"
                            ? "text-blue-400 font-bold"
                            : "opacity-60"
                        }
                      >
                        1. Assigned
                      </span>
                      <span>&rarr;</span>
                      <span
                        className={
                          assignment.status === "en_route"
                            ? "text-indigo-400 font-bold"
                            : "opacity-60"
                        }
                      >
                        2. En Route
                      </span>
                      <span>&rarr;</span>
                      <span
                        className={
                          assignment.status === "completed"
                            ? "text-emerald-400 font-bold"
                            : "opacity-60"
                        }
                      >
                        3. Resolved
                      </span>
                    </div>

                    {/* Status Action Buttons */}
                    {assignment.status === "assigned" && (
                      <Button
                        variant="primary"
                        size="md"
                        loading={isUpdating}
                        onClick={() => handleStatusUpdate(assignment.id, "en_route", assignment.resource_id)}
                        className="w-full font-bold"
                        icon={<Navigation className="w-4 h-4" />}
                      >
                        En Route to Incident Location
                      </Button>
                    )}

                    {assignment.status === "en_route" && (
                      <Button
                        variant="success"
                        size="md"
                        loading={isUpdating}
                        onClick={() => handleStatusUpdate(assignment.id, "completed", assignment.resource_id)}
                        className="w-full font-bold"
                        icon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Mark Completed & Resolve Incident
                      </Button>
                    )}

                    {assignment.status === "completed" && (
                      <div className="w-full py-2 bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold rounded-button text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Task Resolved & Citizen Notified
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeamDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-slate-400 text-sm font-mono">
          Loading responder portal...
        </div>
      }
    >
      <TeamDashboardContent />
    </Suspense>
  );
}
