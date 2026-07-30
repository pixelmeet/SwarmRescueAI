"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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

interface UnifiedResource {
  id: string;
  name: string;
  type: string;
  kind: "rescue_team" | "ambulance" | "volunteer";
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
          ...tList.map((t: RescueTeam) => ({ id: t.id, name: t.name, type: t.type, kind: "rescue_team" as const })),
          ...aList.map((a: Ambulance) => ({ id: a.id, name: `Ambulance — ${a.driver_name}`, type: a.plate_number, kind: "ambulance" as const })),
          ...vList.map((v: Volunteer) => ({ id: v.id, name: `Volunteer — ${v.name}`, type: v.email, kind: "volunteer" as const })),
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
  const handleStatusUpdate = async (assignmentId: string, newStatus: AssignmentStatus) => {
    setUpdatingId(assignmentId);
    setToastMessage(null);

    try {
      await updateAssignmentStatus(assignmentId, newStatus);
      
      const statusText = newStatus === "en_route" ? "En Route to Location" : "Completed & Request Resolved";
      setToastMessage(`Status updated to: ${statusText}. Resolution notifications triggered.`);

      // Optimistic update
      setAssignments((prev) =>
        prev.map((a) => (a.id === assignmentId ? { ...a, status: newStatus } : a))
      );

      await loadData();
    } catch (err) {
      console.error("Failed to update status:", err);
      setToastMessage(`Error updating status: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const activeResource = resources.find((r) => r.id === selectedResourceId);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-400 tracking-tight flex items-center gap-2.5">
            <svg className="w-8 h-8 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Field Responder Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dedicated responder view for field teams, ambulances, and volunteers to manage dispatches and resolve incidents.
          </p>
        </div>

        {/* Resource Picker */}
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">Active Unit:</label>
          <select
            value={selectedResourceId}
            onChange={(e) => setSelectedResourceId(e.target.value)}
            className="bg-slate-950 text-emerald-400 text-xs font-bold border border-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="">All Field Assignments</option>
            {resources.map((res) => (
              <option key={res.id} value={res.id}>
                {res.name} ({res.type})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 font-medium flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Assigned Tasks Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Assigned Field Tasks ({assignments.length})
            {activeResource && <span className="text-xs text-emerald-400 normal-case font-medium">for {activeResource.name}</span>}
          </h3>

          <button
            type="button"
            onClick={loadData}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-2">
            <svg className="w-10 h-10 mx-auto text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-slate-300 font-semibold">No Active Dispatches</p>
            <p className="text-[11px] text-slate-500">This unit has no pending emergency assignments at present.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((assignment) => {
              const req = requests.find((r) => r.id === assignment.request_id);
              const isUpdating = updatingId === assignment.id;

              return (
                <div
                  key={assignment.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg hover:border-slate-700 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded font-bold uppercase mr-2">
                        {req?.category || "Emergency"}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] rounded uppercase font-bold border ${
                        req?.severity === "critical"
                          ? "bg-red-950 text-red-400 border-red-800"
                          : req?.severity === "high"
                          ? "bg-orange-950 text-orange-400 border-orange-800"
                          : "bg-amber-950 text-amber-400 border-amber-800"
                      }`}>
                        {req?.severity || "High"}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 text-[11px] rounded-full uppercase font-bold border ${
                      assignment.status === "completed"
                        ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                        : assignment.status === "en_route"
                        ? "bg-blue-950 text-blue-400 border-blue-800 animate-pulse"
                        : "bg-amber-950 text-amber-400 border-amber-800"
                    }`}>
                      {assignment.status.replace("_", " ")}
                    </span>
                  </div>

                  {req && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-200 font-medium leading-relaxed">
                        {req.description}
                      </p>

                      <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-900">
                        <div><strong className="text-slate-300">Reporter:</strong> {req.reporter_name} ({req.reporter_email})</div>
                        <div><strong className="text-slate-300">Coordinates:</strong> [{req.location.coordinates[1].toFixed(4)}, {req.location.coordinates[0].toFixed(4)}]</div>
                        <div><strong className="text-slate-300">ETA:</strong> {assignment.eta_minutes || 10} minutes</div>
                      </div>
                    </div>
                  )}

                  {/* Status Action Buttons */}
                  <div className="pt-2 flex gap-2">
                    {assignment.status === "assigned" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate(assignment.id, "en_route")}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {isUpdating ? "Updating..." : "🚀 En Route to Emergency"}
                      </button>
                    )}

                    {assignment.status === "en_route" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate(assignment.id, "completed")}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {isUpdating ? "Completing..." : "✅ Mark Completed & Resolve Incident"}
                      </button>
                    )}

                    {assignment.status === "completed" && (
                      <div className="w-full py-1.5 bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold rounded-xl text-center">
                        Task Completed & Resolution Email Sent
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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
          Loading responder portal...
        </div>
      }
    >
      <TeamDashboardContent />
    </Suspense>
  );
}
