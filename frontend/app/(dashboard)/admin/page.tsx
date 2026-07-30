"use client";

import React, { useState, useEffect } from "react";
import { StatsPanel } from "@/components/dashboard/StatsPanel";
import { RequestQueue } from "@/components/dashboard/RequestQueue";
import {
  EmergencyRequestResponse,
  RecommendationMatch,
  RescueTeam,
  Ambulance,
  Hospital,
  Volunteer,
  getRequestRecommendations,
  createAssignment,
  listTeams,
  listAmbulances,
  listHospitals,
  listVolunteers,
} from "@/lib/api";

export default function AdminDashboardPage() {
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequestResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationMatch[]>([]);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);
  const [recError, setRecError] = useState<string | null>(null);

  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  // Active Resource Tab
  const [activeTab, setActiveTab] = useState<"teams" | "ambulances" | "hospitals" | "volunteers">("teams");
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);

  const loadResources = async () => {
    try {
      const [tRes, aRes, hRes, vRes] = await Promise.all([
        listTeams().catch(() => []),
        listAmbulances().catch(() => []),
        listHospitals().catch(() => []),
        listVolunteers().catch(() => []),
      ]);
      setTeams(tRes);
      setAmbulances(aRes);
      setHospitals(hRes);
      setVolunteers(vRes);
    } catch (err) {
      console.error("Error loading resources:", err);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleSelectRequest = async (req: EmergencyRequestResponse) => {
    setSelectedRequest(req);
    setRecommendations([]);
    setRecError(null);
    setDispatchStatus(null);
    setLoadingRecs(true);

    try {
      const matches = await getRequestRecommendations(req.id);
      setRecommendations(matches);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
      setRecError(err instanceof Error ? err.message : "Failed to load resource recommendations.");
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleDispatch = async (rec: RecommendationMatch) => {
    if (!selectedRequest) return;
    setDispatchingId(rec.resource_id);
    setDispatchStatus(null);

    try {
      const res = await createAssignment({
        request_id: selectedRequest.id,
        resource_type: rec.resource_type,
        resource_id: rec.resource_id,
        eta_minutes: rec.eta_minutes,
      });

      setDispatchStatus(`Successfully assigned ${rec.resource_name} (ID: ${res.id})`);
      // Update local status
      setSelectedRequest({ ...selectedRequest, status: "assigned" });
      loadResources();
    } catch (err) {
      console.error("Dispatch error:", err);
      setDispatchStatus(`Dispatch failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Header */}
      <header className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-400 tracking-tight flex items-center gap-2">
            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            SwarmRescue Admin Command Center
          </h1>
          <p className="text-xs text-slate-400">Live emergency dispatch, real-time scoring recommendations & resource management.</p>
        </div>
      </header>

      {/* Top Real-Time Stats */}
      <StatsPanel />

      {/* Main Grid: Left Request Stream, Right Dispatch & Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Queue (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <RequestQueue
            onSelectRequest={handleSelectRequest}
            selectedRequestId={selectedRequest?.id}
          />
        </div>

        {/* Right Column: Intelligent Dispatch Engine (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Dispatch Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>Intelligent Resource Dispatch Engine</span>
              {selectedRequest && (
                <span className="text-xs text-blue-400 font-mono">Request: {selectedRequest.id.substring(0, 8)}</span>
              )}
            </h3>

            {!selectedRequest ? (
              <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-400 text-xs space-y-2">
                <svg className="w-10 h-10 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p>Select any emergency incident from the left queue to view AI recommendations and dispatch resources.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selected Request Detail */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white uppercase">{selectedRequest.category} Incident</span>
                    <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded text-[10px] uppercase font-bold">
                      {selectedRequest.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{selectedRequest.description}</p>
                </div>

                {dispatchStatus && (
                  <div className="p-3 bg-blue-950/80 border border-blue-600 rounded-lg text-xs text-blue-200 font-medium">
                    {dispatchStatus}
                  </div>
                )}

                {/* Recommendations List */}
                {loadingRecs ? (
                  <div className="p-6 text-center text-xs text-slate-400 animate-pulse">
                    Computing optimal resource matches with Scoring Engine...
                  </div>
                ) : recError ? (
                  <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-300">
                    {recError}
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 text-center">
                    No available resources matched for this request location/skills.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Recommended Units (Ranked by Score)
                    </span>
                    {recommendations.map((rec, idx) => (
                      <div
                        key={rec.resource_id}
                        className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-blue-900/60 text-blue-400 border border-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="font-bold text-slate-100">{rec.resource_name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="uppercase text-[10px] font-semibold text-slate-500">{rec.resource_type}</span>
                              <span>&bull;</span>
                              <span className="text-emerald-400">{rec.distance_km} km away</span>
                              <span>&bull;</span>
                              <span className="text-amber-400">ETA {rec.eta_minutes} min</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xs font-bold text-blue-400">{Math.round(rec.composite_score * 100)}%</div>
                            <div className="text-[10px] text-slate-500">Score</div>
                          </div>
                          <button
                            onClick={() => handleDispatch(rec)}
                            disabled={dispatchingId === rec.resource_id || selectedRequest.status === "assigned"}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition shadow shrink-0"
                          >
                            {dispatchingId === rec.resource_id ? "Dispatching..." : "Dispatch"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resource Inventory */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
                Available Resource Inventory
              </h3>
              <div className="flex gap-1 text-xs">
                {(["teams", "ambulances", "hospitals", "volunteers"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-md font-semibold capitalize transition ${
                      activeTab === tab ? "bg-slate-800 text-white border border-slate-700" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[240px] overflow-y-auto pr-1">
              {activeTab === "teams" && (
                <div className="space-y-2">
                  {teams.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No rescue teams found.</p>
                  ) : (
                    teams.map((t) => (
                      <div key={t.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-200">{t.name}</span>
                          <span className="text-[10px] text-slate-500 uppercase ml-2">({t.type})</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] rounded uppercase font-semibold ${t.status === "available" ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"}`}>
                          {t.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "ambulances" && (
                <div className="space-y-2">
                  {ambulances.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No ambulances found.</p>
                  ) : (
                    ambulances.map((a) => (
                      <div key={a.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-200">{a.driver_name}</span>
                          <span className="text-[10px] font-mono text-slate-400 ml-2">[{a.plate_number}]</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] rounded uppercase font-semibold ${a.status === "available" ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"}`}>
                          {a.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "hospitals" && (
                <div className="space-y-2">
                  {hospitals.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No hospitals found.</p>
                  ) : (
                    hospitals.map((h) => (
                      <div key={h.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-200">{h.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2">Ph: {h.phone}</span>
                        </div>
                        <span className="font-bold text-emerald-400 text-xs">
                          {h.available_beds} / {h.total_beds} beds free
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "volunteers" && (
                <div className="space-y-2">
                  {volunteers.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No volunteers found.</p>
                  ) : (
                    volunteers.map((v) => (
                      <div key={v.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-200">{v.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2">{v.email}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] rounded uppercase font-semibold ${v.status === "available" ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"}`}>
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
