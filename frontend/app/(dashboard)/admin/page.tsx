"use client";

import React, { useState, useEffect, useCallback } from "react";
import { StatsPanel } from "@/components/dashboard/StatsPanel";
import { RequestQueue } from "@/components/dashboard/RequestQueue";
import { AssignmentCard } from "@/components/dashboard/AssignmentCard";
import { LeafletMap } from "@/components/map/LeafletMap";
import { socketClient, ConnectionStatus } from "@/lib/socket";
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
} from "@/lib/api";

const EMPTY_RECOMMENDATIONS: RequestRecommendations = {
  rescue_teams: [],
  ambulances: [],
  hospitals: [],
  volunteers: [],
};

const POLLING_INTERVAL_MS = 10000; // 10 seconds polling fallback

export default function AdminDashboardPage() {
  const [requests, setRequests] = useState<EmergencyRequestResponse[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(true);
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequestResponse | null>(null);

  const [recommendations, setRecommendations] = useState<RequestRecommendations>(EMPTY_RECOMMENDATIONS);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);
  const [recError, setRecError] = useState<string | null>(null);

  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  // Connection status state
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>("disconnected");

  // Resources state
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [activeTab, setActiveTab] = useState<"teams" | "ambulances" | "hospitals" | "volunteers">("teams");

  // Fetch all live dashboard data
  const refreshDashboardData = useCallback(async (isInitial = false) => {
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

      // If a request is selected, update selectedRequest reference with fresh data
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
  }, [selectedRequest]);

  // Initial load & WebSocket connection setup
  useEffect(() => {
    refreshDashboardData(true);

    // Connect WebSocket client
    socketClient.connect();
    const unsubStatus = socketClient.onStatusChange(setWsStatus);

    // Subscribe to live WebSocket events
    const unsubNewReq = socketClient.subscribe("new_request", (data: EmergencyRequestResponse) => {
      setRequests((prev) => {
        const exists = prev.some((r) => r.id === data.id);
        if (exists) return prev.map((r) => (r.id === data.id ? { ...r, ...data } : r));
        return [data, ...prev];
      });
    });

    const unsubStatusUpdate = socketClient.subscribe("status_update", (data: EmergencyRequestResponse) => {
      setRequests((prev) => prev.map((r) => (r.id === data.id ? { ...r, ...data } : r)));
      setSelectedRequest((prev) => (prev && prev.id === data.id ? { ...prev, ...data } : prev));
    });

    const unsubNewAssign = socketClient.subscribe("new_assignment", () => {
      refreshDashboardData(false);
    });

    const unsubResUpdate = socketClient.subscribe("resource_update", () => {
      refreshDashboardData(false);
    });

    return () => {
      unsubStatus();
      unsubNewReq();
      unsubStatusUpdate();
      unsubNewAssign();
      unsubResUpdate();
      socketClient.disconnect();
    };
  }, []);

  // Polling Fallback (Only active if WebSocket fails after max reconnections)
  useEffect(() => {
    if (wsStatus !== "fallback_polling") return;

    const interval = setInterval(() => {
      refreshDashboardData(false);
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [wsStatus, refreshDashboardData]);

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
      setRecError(err instanceof Error ? err.message : "Failed to load resource recommendations.");
    } finally {
      setLoadingRecs(false);
    }
  };

  // Perform Manual Assignment
  const handleAssign = async (candidate: RecommendationCandidate, resourceType: ResourceType) => {
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

      setDispatchStatus(`Successfully assigned ${candidate.name} (${resourceType.replace("_", " ")}) — Assignment ID: ${res.id}`);
      
      // Optimistic state update
      setSelectedRequest({ ...selectedRequest, status: "assigned" });
      setRequests((prev) =>
        prev.map((r) => (r.id === selectedRequest.id ? { ...r, status: "assigned" } : r))
      );

      // Trigger immediate backend data refresh
      await refreshDashboardData(false);
    } catch (err) {
      console.error("Dispatch error:", err);
      setDispatchStatus(`Dispatch failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-400 tracking-tight flex items-center gap-2.5">
            <svg className="w-8 h-8 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            SwarmRescue AI Admin Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time emergency queue, geospatial AI scoring recommendations & manual resource dispatch.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              wsStatus === "connected"
                ? "bg-emerald-500 animate-pulse"
                : wsStatus === "connecting"
                ? "bg-amber-400 animate-ping"
                : wsStatus === "fallback_polling"
                ? "bg-amber-500 animate-pulse"
                : "bg-slate-600"
            }`}
          ></span>
          <span className="font-medium">
            {wsStatus === "connected" && "Live WebSocket Active"}
            {wsStatus === "connecting" && "Connecting WebSocket..."}
            {wsStatus === "fallback_polling" && "10s Polling Fallback"}
            {wsStatus === "disconnected" && "Offline"}
          </span>
        </div>
      </header>

      {/* Top Real-Time Stats */}
      <StatsPanel />

      {/* Main Grid: 2-Column Layout (Left 1/3 Queue & Dispatch, Right 2/3 Map & Inventory) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (roughly 1/3 width: 4 cols out of 12) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {/* Incident Queue */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <RequestQueue
              requests={requests}
              loading={loadingRequests}
              onRefresh={() => refreshDashboardData(false)}
              onSelectRequest={handleSelectRequest}
              selectedRequestId={selectedRequest?.id}
            />
          </div>

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

        {/* Right Column (roughly 2/3 width: 8 cols out of 12) */}
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Active Resource Inventory
              </h3>
              <div className="flex gap-1 text-xs">
                {(["teams", "ambulances", "hospitals", "volunteers"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-md font-semibold capitalize transition cursor-pointer ${
                      activeTab === tab
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[220px] overflow-y-auto pr-1">
              {activeTab === "teams" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {teams.length === 0 ? (
                    <p className="text-xs text-slate-400 italic col-span-2">No rescue teams found.</p>
                  ) : (
                    teams.map((t) => (
                      <div key={t.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-slate-200">{t.name}</div>
                          <div className="text-[10px] text-slate-500 uppercase">Type: {t.type}</div>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] rounded uppercase font-bold border ${
                          t.status === "available"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                            : "bg-amber-950 text-amber-400 border-amber-800"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "ambulances" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ambulances.length === 0 ? (
                    <p className="text-xs text-slate-400 italic col-span-2">No ambulances found.</p>
                  ) : (
                    ambulances.map((a) => (
                      <div key={a.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-slate-200">{a.driver_name}</div>
                          <div className="text-[10px] font-mono text-slate-400">Plate: {a.plate_number}</div>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] rounded uppercase font-bold border ${
                          a.status === "available"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                            : "bg-amber-950 text-amber-400 border-amber-800"
                        }`}>
                          {a.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "hospitals" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {hospitals.length === 0 ? (
                    <p className="text-xs text-slate-400 italic col-span-2">No hospitals found.</p>
                  ) : (
                    hospitals.map((h) => (
                      <div key={h.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-slate-200">{h.name}</div>
                          <div className="text-[10px] text-slate-400">Ph: {h.phone}</div>
                        </div>
                        <span className="font-bold text-emerald-400 text-xs bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800">
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
                    <p className="text-xs text-slate-400 italic col-span-2">No volunteers found.</p>
                  ) : (
                    volunteers.map((v) => (
                      <div key={v.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-slate-200">{v.name}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{v.email}</div>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] rounded uppercase font-bold border ${
                          v.status === "available"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                            : "bg-amber-950 text-amber-400 border-amber-800"
                        }`}>
                          {v.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
