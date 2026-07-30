"use client";

import React, { useEffect, useState } from "react";
import {
  listRequests,
  listTeams,
  listAmbulances,
  listHospitals,
  listVolunteers,
  EmergencyRequestResponse,
  RescueTeam,
  Ambulance,
  Hospital,
  Volunteer,
} from "@/lib/api";

export function StatsPanel() {
  const [requests, setRequests] = useState<EmergencyRequestResponse[]>([]);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [reqRes, teamRes, ambRes, hospRes, volRes] = await Promise.all([
          listRequests().catch(() => []),
          listTeams().catch(() => []),
          listAmbulances().catch(() => []),
          listHospitals().catch(() => []),
          listVolunteers().catch(() => []),
        ]);
        setRequests(reqRes);
        setTeams(teamRes);
        setAmbulances(ambRes);
        setHospitals(hospRes);
        setVolunteers(volRes);
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const activeEmergencies = requests.filter((r) => r.status !== "resolved").length;
  const criticalCount = requests.filter((r) => r.severity === "critical" && r.status !== "resolved").length;
  
  const busyTeams = teams.filter((t) => t.status === "busy").length;
  const busyAmbulances = ambulances.filter((a) => a.status === "busy").length;
  const dispatchedUnits = busyTeams + busyAmbulances;
  const totalUnits = teams.length + ambulances.length + volunteers.length;

  const totalAvailableBeds = hospitals.reduce((acc, h) => acc + (h.available_beds || 0), 0);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl h-24"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex justify-between items-start">
          <div className="text-2xl font-black text-red-400">{activeEmergencies}</div>
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 bg-red-600/30 border border-red-500 text-red-400 text-[10px] font-bold rounded-full animate-pulse">
              {criticalCount} CRITICAL
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400 font-medium mt-1">Active Emergencies</div>
      </div>

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="text-2xl font-black text-blue-400">{dispatchedUnits} <span className="text-xs font-normal text-slate-500">/ {totalUnits}</span></div>
        <div className="text-xs text-slate-400 font-medium mt-1">Dispatched Units</div>
      </div>

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="text-2xl font-black text-emerald-400">{totalAvailableBeds}</div>
        <div className="text-xs text-slate-400 font-medium mt-1">Available Hospital Beds</div>
      </div>

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="text-2xl font-black text-amber-400">{volunteers.length}</div>
        <div className="text-xs text-slate-400 font-medium mt-1">Active Volunteers</div>
      </div>
    </div>
  );
}
