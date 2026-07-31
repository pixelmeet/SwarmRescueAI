"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Shield, RefreshCw } from "lucide-react";
import { StatsPanel } from "@/components/dashboard/StatsPanel";
import { RequestQueue } from "@/components/dashboard/RequestQueue";
import { AssignmentCard } from "@/components/dashboard/AssignmentCard";
import { LeafletMap } from "@/components/map/LeafletMap";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/ToastContext";
import {
  EmergencyRequestResponse,
  RecommendationCandidate,
  RequestRecommendations,
  RescueTeam,
  Ambulance,
  Hospital,
  Volunteer,
  ResourceType,
  getRequestRecommendations,
  createAssignment,
  listRequests,
  listTeams,
  listAmbulances,
  listHospitals,
  listVolunteers,
  getAdminToken,
  removeAdminToken,
  loginAdmin,
} from "@/lib/api";
import { socketClient } from "@/lib/socket";

const EMPTY_RECOMMENDATIONS: RequestRecommendations = {
  rescue_teams: [],
  ambulances: [],
  hospitals: [],
  volunteers: [],
};

export default function AdminDashboardPage() {
  const { addToast } = useToast();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // Login form state
  const [usernameInput, setUsernameInput] = useState<string>("admin");
  const [passwordInput, setPasswordInput] = useState<string>("adminpass");
  const [loggingIn, setLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [requests, setRequests] = useState<EmergencyRequestResponse[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(true);
  const [selectedRequest, setSelectedRequest] =
    useState<EmergencyRequestResponse | null>(null);

  const [recommendations, setRecommendations] = useState<RequestRecommendations>(
    EMPTY_RECOMMENDATIONS
  );
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);
  const [recError, setRecError] = useState<string | null>(null);

  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  // Resources state
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [activeTab, setActiveTab] = useState<
    "teams" | "ambulances" | "hospitals" | "volunteers"
  >("teams");

  // Verify auth on client load
  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      setIsAuthenticated(true);
    }
    setCheckingAuth(false);
  }, []);

  // Fetch all live dashboard data
  const refreshDashboardData = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoadingRequests(true);

      try {
        const [reqRes, tRes, aRes, hRes, vRes] = await Promise.all([
          listRequests().catch(() => []),
          listTeams().catch(() => []),
          listAmbulances().catch(() => []),
          listHospitals().catch(() => []),
          listVolunteers().catch(() => []),
        ]);

        setRequests(reqRes);
        setTeams(tRes);
        setAmbulances(aRes);
        setHospitals(hRes);
        setVolunteers(vRes);

        if (selectedRequest) {
          const updated = reqRes.find((r) => r.id === selectedRequest.id);
          if (updated) {
            setSelectedRequest(updated);
          }
        }
      } catch (err) {
        console.error("Dashboard background refresh error:", err);
      } finally {
        if (isInitial) setLoadingRequests(false);
      }
    },
    [selectedRequest]
  );

  // Setup dashboard data & WebSocket subscription when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    refreshDashboardData(true);

    socketClient.connect();

    const unsubNewReq = socketClient.subscribe(
      "new_request",
      (data: EmergencyRequestResponse) => {
        setRequests((prev) => {
          const exists = prev.some((r) => r.id === data.id);
          if (exists) return prev.map((r) => (r.id === data.id ? { ...r, ...data } : r));
          return [data, ...prev];
        });
        addToast("info", "New Incident Reported", `${data.category.toUpperCase()} emergency - ${data.severity.toUpperCase()}`);
      }
    );

    const unsubStatusUpdate = socketClient.subscribe(
      "status_update",
      (data: EmergencyRequestResponse) => {
        setRequests((prev) =>
          prev.map((r) => (r.id === data.id ? { ...r, ...data } : r))
        );
        setSelectedRequest((prev) =>
          prev && prev.id === data.id ? { ...prev, ...data } : prev
        );
      }
    );

    const unsubNewAssign = socketClient.subscribe("new_assignment", () => {
      refreshDashboardData(false);
    });

    const unsubResUpdate = socketClient.subscribe("resource_update", () => {
      refreshDashboardData(false);
    });

    return () => {
      unsubNewReq();
      unsubStatusUpdate();
      unsubNewAssign();
      unsubResUpdate();
    };
  }, [isAuthenticated, refreshDashboardData, addToast]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);

    try {
      await loginAdmin({
        username: usernameInput,
        password: passwordInput,
      });
      setIsAuthenticated(true);
      addToast("success", "Session Authenticated", "Welcome to SwarmRescue Command Center");
    } catch (err) {
      console.error("Login failed:", err);
      setLoginError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoggingIn(false);
    }
  };

  // Fetch recommendations whenever a request is selected
  const handleSelectRequest = async (req: EmergencyRequestResponse) => {
    setSelectedRequest(req);
    setRecommendations(EMPTY_RECOMMENDATIONS);
    setRecError(null);
    setDispatchStatus(null);
    setLoadingRecs(true);

    try {
      const matches = await getRequestRecommendations(req.id);
      setRecommendations(matches || EMPTY_RECOMMENDATIONS);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
      setRecError(
        err instanceof Error ? err.message : "Failed to load resource recommendations."
      );
    } finally {
      setLoadingRecs(false);
    }
  };

  // Perform Manual Assignment
  const handleAssign = async (
    candidate: RecommendationCandidate,
    resourceType: ResourceType
  ) => {
    if (!selectedRequest) return;
    setDispatchingId(candidate.resource_id);
    setDispatchStatus(null);

    try {
      const res = await createAssignment({
        request_id: selectedRequest.id,
        resource_type: resourceType,
        resource_id: candidate.resource_id,
        eta_minutes: candidate.eta_minutes || 10,
      });

      const successMsg = `Dispatched ${candidate.name} (${resourceType.replace("_", " ")}) — Assignment #${res.id.substring(0, 6)}`;
      setDispatchStatus(successMsg);
      addToast("success", "Resource Dispatched", successMsg);

      setSelectedRequest({ ...selectedRequest, status: "assigned" });
      setRequests((prev) =>
        prev.map((r) => (r.id === selectedRequest.id ? { ...r, status: "assigned" } : r))
      );

      await refreshDashboardData(false);
    } catch (err) {
      console.error("Dispatch error:", err);
      const errorMsg = `Dispatch failed: ${err instanceof Error ? err.message : "Unknown error"}`;
      setDispatchStatus(errorMsg);
      addToast("error", "Dispatch Failed", errorMsg);
    } finally {
      setDispatchingId(null);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-slate-400 text-sm font-mono">
        <RefreshCw className="w-5 h-5 animate-spin text-primary mr-2" />
        Authenticating session token...
      </div>
    );
  }

  // Unauthenticated Admin Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-primary-muted border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto text-primary">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              Tactical Command Login
            </h2>
            <p className="text-xs text-slate-400">
              Sign in to access SwarmRescue AI real-time dispatch dashboard.
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-button text-xs text-red-300 font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              required
              placeholder="admin"
            />

            <Input
              label="Password"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
              placeholder="••••••••"
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loggingIn}
                className="w-full"
              >
                Authenticate Command Center
              </Button>
            </div>
          </form>

          <p className="text-[11px] text-slate-500 text-center font-mono">
            Default credentials configured in <code className="text-slate-400">.env</code>
          </p>
        </Card>
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen text-slate-100 font-sans">
      {/* Top Real-Time Stats */}
      <StatsPanel />

      {/* Main Grid: 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {/* Incident Queue */}
          <Card>
            <RequestQueue
              requests={requests}
              loading={loadingRequests}
              onRefresh={() => refreshDashboardData(false)}
              onSelectRequest={handleSelectRequest}
              selectedRequestId={selectedRequest?.id}
            />
          </Card>

          {/* Intelligent Resource Dispatch Panel */}
          <AssignmentCard
            selectedRequest={selectedRequest}
            recommendations={recommendations}
            loadingRecs={loadingRecs}
            recError={recError}
            onAssign={handleAssign}
            dispatchStatus={dispatchStatus}
            dispatchingId={dispatchingId}
          />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">
          {/* Interactive Tactical Leaflet Map */}
          <div className="flex-1 min-h-[500px]">
            <LeafletMap
              teams={teams}
              ambulances={ambulances}
              hospitals={hospitals}
              volunteers={volunteers}
              selectedRequest={selectedRequest}
              recommendations={recommendations}
              onSelectRequest={handleSelectRequest}
              allRequests={requests}
            />
          </div>

          {/* Resource Inventory Panel */}
          <Card className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Active Resource Inventory
              </h3>
              <div className="flex gap-1 text-xs">
                {(["teams", "ambulances", "hospitals", "volunteers"] as const).map(
                  (tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 rounded-badge text-[11px] font-bold capitalize transition cursor-pointer ${
                        activeTab === tab
                          ? "bg-primary text-white shadow-sm"
                          : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60"
                      }`}
                    >
                      {tab}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
              {activeTab === "teams" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {teams.length === 0 ? (
                    <p className="text-xs text-slate-400 italic col-span-2">
                      No rescue teams registered.
                    </p>
                  ) : (
                    teams.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 bg-slate-950 border border-slate-800 rounded-card flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-200">{t.name}</div>
                          <div className="text-[10px] text-slate-500 uppercase">
                            Type: {t.type}
                          </div>
                        </div>
                        <StatusBadge status={t.status as any} size="xs" />
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "ambulances" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ambulances.length === 0 ? (
                    <p className="text-xs text-slate-400 italic col-span-2">
                      No ambulances registered.
                    </p>
                  ) : (
                    ambulances.map((a) => (
                      <div
                        key={a.id}
                        className="p-2.5 bg-slate-950 border border-slate-800 rounded-card flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-200">{a.driver_name}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            Plate: {a.plate_number}
                          </div>
                        </div>
                        <StatusBadge status={a.status as any} size="xs" />
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "hospitals" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {hospitals.length === 0 ? (
                    <p className="text-xs text-slate-400 italic col-span-2">
                      No hospitals registered.
                    </p>
                  ) : (
                    hospitals.map((h) => (
                      <div
                        key={h.id}
                        className="p-2.5 bg-slate-950 border border-slate-800 rounded-card flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-200">{h.name}</div>
                          <div className="text-[10px] text-slate-400">Ph: {h.phone}</div>
                        </div>
                        <span className="font-bold text-emerald-400 text-xs bg-emerald-950/80 px-2 py-0.5 rounded-badge border border-emerald-800 font-telemetry">
                          {h.available_beds}/{h.total_beds} beds
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "volunteers" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {volunteers.length === 0 ? (
                    <p className="text-xs text-slate-400 italic col-span-2">
                      No volunteers registered.
                    </p>
                  ) : (
                    volunteers.map((v) => (
                      <div
                        key={v.id}
                        className="p-2.5 bg-slate-950 border border-slate-800 rounded-card flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-200">{v.name}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {v.email}
                          </div>
                        </div>
                        <StatusBadge status={v.status as any} size="xs" />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
