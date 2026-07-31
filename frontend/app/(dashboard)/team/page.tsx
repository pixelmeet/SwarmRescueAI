"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  CheckCircle2,
  Navigation,
  RefreshCw,
  Clock,
  MapPin,
  Lock,
  KeyRound,
  ShieldCheck,
  Search,
  AlertCircle,
} from "lucide-react";
import {
  listAssignments,
  listRequests,
  listTeams,
  listAmbulances,
  listVolunteers,
  updateAssignmentStatus,
  getFieldResourceId,
  getFieldAccessCode,
  setFieldCredentials,
  removeFieldCredentials,
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
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/ToastContext";
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
  const initialResourceIdFromUrl = searchParams.get("resource_id") || "";
  const { addToast } = useToast();

  const [resources, setResources] = useState<UnifiedResource[]>([]);
  
  // Credentials & Authentication state
  const [authenticatedResourceId, setAuthenticatedResourceId] = useState<string>("");
  const [authenticatedAccessCode, setAuthenticatedAccessCode] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Login screen form state
  const [loginResourceId, setLoginResourceId] = useState<string>("");
  const [loginAccessCode, setLoginAccessCode] = useState<string>("");
  const [loginSearchQuery, setLoginSearchQuery] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard Data State
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [requests, setRequests] = useState<EmergencyRequestResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Check stored credentials on mount
  useEffect(() => {
    const storedResId = getFieldResourceId();
    const storedCode = getFieldAccessCode();
    if (storedResId && storedCode) {
      setAuthenticatedResourceId(storedResId);
      setAuthenticatedAccessCode(storedCode);
      setIsAuthenticated(true);
    } else if (initialResourceIdFromUrl) {
      setLoginResourceId(initialResourceIdFromUrl);
    }
  }, [initialResourceIdFromUrl]);

  // Load roster resources for selector dropdown
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

        if (!loginResourceId && unified.length > 0) {
          setLoginResourceId(unified[0].id);
        }
      } catch (err) {
        console.error("Error loading roster resources:", err);
      }
    }
    loadResources();
  }, []);

  // Load assignments for authenticated resource & all emergency requests
  const loadData = useCallback(async () => {
    if (!authenticatedResourceId) return;

    setLoading(true);
    setFetchError(null);
    try {
      const [assignList, reqList] = await Promise.all([
        listAssignments(authenticatedResourceId),
        listRequests(),
      ]);
      setAssignments(assignList);
      setRequests(reqList);
    } catch (err) {
      console.error("Error loading team assignments:", err);
      setFetchError(err instanceof Error ? err.message : "Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  }, [authenticatedResourceId]);

  useEffect(() => {
    if (isAuthenticated && authenticatedResourceId) {
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
    }
  }, [isAuthenticated, authenticatedResourceId, loadData]);

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginResourceId) {
      setLoginError("Please select a resource unit.");
      return;
    }
    if (!loginAccessCode.trim()) {
      setLoginError("Please enter your resource access code.");
      return;
    }

    setFieldCredentials(loginResourceId, loginAccessCode.trim());
    setAuthenticatedResourceId(loginResourceId);
    setAuthenticatedAccessCode(loginAccessCode.trim());
    setIsAuthenticated(true);
  };

  // Handle assignment status transition (en_route -> completed)
  const handleStatusUpdate = async (
    assignmentId: string,
    newStatus: AssignmentStatus,
    targetResourceId: string
  ) => {
    setUpdatingId(assignmentId);

    try {
      await updateAssignmentStatus(
        assignmentId,
        newStatus,
        targetResourceId,
        authenticatedAccessCode
      );

      const statusText =
        newStatus === "en_route"
          ? "En Route to Incident Location"
          : "Completed & Incident Resolved";

      addToast("success", "Status Updated", statusText);

      setAssignments((prev) =>
        prev.map((a) => (a.id === assignmentId ? { ...a, status: newStatus } : a))
      );

      await loadData();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      const errDetail = err?.message || String(err);
      
      if (errDetail.includes("401") || errDetail.toLowerCase().includes("unauthorized") || errDetail.toLowerCase().includes("access code")) {
        addToast("error", "Authentication Error", "Invalid access code. Please log in again.");
        removeFieldCredentials();
        setIsAuthenticated(false);
        setAuthenticatedResourceId("");
        setAuthenticatedAccessCode("");
        setAssignments([]);
        setRequests([]);
        setLoginError("Invalid access code for the selected resource. Please re-authenticate.");
      } else {
        addToast("error", "Update Failed", errDetail);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Render Login View if not authenticated
  if (!isAuthenticated) {
    const filteredResources = resources.filter(
      (r) =>
        r.name.toLowerCase().includes(loginSearchQuery.toLowerCase()) ||
        r.type.toLowerCase().includes(loginSearchQuery.toLowerCase()) ||
        r.kind.toLowerCase().includes(loginSearchQuery.toLowerCase())
    );

    return (
      <div className="min-h-[80vh] bg-background flex flex-col items-center justify-center p-4 text-slate-100 font-sans">
        <Card className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-emerald-400 tracking-tight">
              Field Responder Login
            </h1>
            <p className="text-xs text-slate-400">
              Select your active resource unit and enter your access code to view and update emergency tasks.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-button flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Resource Selector with Search Filter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Resource Unit
              </label>

              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter resources..."
                  value={loginSearchQuery}
                  onChange={(e) => setLoginSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 text-xs border border-slate-800 rounded-button pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={loginResourceId}
                onChange={(e) => setLoginResourceId(e.target.value)}
                className="w-full bg-slate-950 text-emerald-400 text-xs font-bold border border-slate-800 rounded-button px-3 py-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {filteredResources.length === 0 ? (
                  <option value="">No matching resources found</option>
                ) : (
                  filteredResources.map((res) => (
                    <option key={res.id} value={res.id}>
                      {res.name} ({res.type})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Access Code Input */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Access Code</span>
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                type="password"
                placeholder="Enter resource access code"
                value={loginAccessCode}
                onChange={(e) => setLoginAccessCode(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 text-xs font-mono border border-slate-800 rounded-button px-3 py-2.5 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              type="submit"
              className="w-full font-bold pt-2.5 pb-2.5 mt-2"
              icon={<Lock className="w-4 h-4" />}
            >
              Authenticate & Access Portal
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const activeResource = resources.find((r) => r.id === authenticatedResourceId);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 bg-background min-h-screen text-slate-100 font-sans">
      {/* Active Unit Badge Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-primary)] flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-emerald-400 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            Field Responder Operations
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active task queue & status transition workflow
          </p>
        </div>

        <div className="bg-surface-primary border border-[var(--border-primary)] px-3.5 py-1.5 rounded-card flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
            Active Unit:
          </span>
          <span className="text-xs font-extrabold text-emerald-400 whitespace-nowrap">
            {activeResource ? activeResource.name : authenticatedResourceId || "Authenticated"}
          </span>
        </div>
      </div>

      {/* Assigned Tasks Grid */}
      <Card className="space-y-5">
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
        ) : fetchError ? (
          <EmptyState
            icon="error"
            title="Failed to Load Assignments"
            description={fetchError}
            actionLabel="Retry Loading"
            onAction={loadData}
          />
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
      </Card>
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
