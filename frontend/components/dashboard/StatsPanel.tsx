"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Truck, Building2, Users } from "lucide-react";
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
  const criticalCount = requests.filter(
    (r) => r.severity === "critical" && r.status !== "resolved"
  ).length;

  const busyTeams = teams.filter((t) => t.status === "busy").length;
  const busyAmbulances = ambulances.filter((a) => a.status === "busy").length;
  const dispatchedUnits = busyTeams + busyAmbulances;
  const totalUnits = teams.length + ambulances.length + volunteers.length;

  const totalAvailableBeds = hospitals.reduce(
    (acc, h) => acc + (h.available_beds || 0),
    0
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 bg-surface-primary/80 border border-[var(--border-primary)] rounded-card h-24"
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Active Emergencies */}
      <div className="p-4 bg-surface-primary border border-[var(--border-primary)] rounded-card shadow-lg hover:border-slate-700 transition-colors">
        <div className="flex justify-between items-start">
          <div className="text-3xl font-extrabold text-red-400 font-telemetry tracking-tight">
            {activeEmergencies}
          </div>
          {criticalCount > 0 ? (
            <span className="px-2 py-0.5 bg-red-950/80 border border-red-800 text-red-400 text-[10px] font-bold rounded-full animate-pulse-glow flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {criticalCount} CRITICAL
            </span>
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400/50" />
          )}
        </div>
        <div className="text-xs text-slate-400 font-medium mt-2 flex items-center gap-1.5">
          <span>Active Emergencies</span>
        </div>
      </div>

      {/* Dispatched Units */}
      <div className="p-4 bg-surface-primary border border-[var(--border-primary)] rounded-card shadow-lg hover:border-slate-700 transition-colors">
        <div className="flex justify-between items-start">
          <div className="text-3xl font-extrabold text-blue-400 font-telemetry tracking-tight">
            {dispatchedUnits}
            <span className="text-xs font-normal text-slate-500 ml-1 font-mono">
              / {totalUnits}
            </span>
          </div>
          <Truck className="w-5 h-5 text-blue-400/50" />
        </div>
        <div className="text-xs text-slate-400 font-medium mt-2">
          Dispatched Units
        </div>
      </div>

      {/* Available Beds */}
      <div className="p-4 bg-surface-primary border border-[var(--border-primary)] rounded-card shadow-lg hover:border-slate-700 transition-colors">
        <div className="flex justify-between items-start">
          <div className="text-3xl font-extrabold text-emerald-400 font-telemetry tracking-tight">
            {totalAvailableBeds}
          </div>
          <Building2 className="w-5 h-5 text-emerald-400/50" />
        </div>
        <div className="text-xs text-slate-400 font-medium mt-2">
          Available Hospital Beds
        </div>
      </div>

      {/* Active Volunteers */}
      <div className="p-4 bg-surface-primary border border-[var(--border-primary)] rounded-card shadow-lg hover:border-slate-700 transition-colors">
        <div className="flex justify-between items-start">
          <div className="text-3xl font-extrabold text-amber-400 font-telemetry tracking-tight">
            {volunteers.length}
          </div>
          <Users className="w-5 h-5 text-amber-400/50" />
        </div>
        <div className="text-xs text-slate-400 font-medium mt-2">
          Active Volunteers
        </div>
      </div>
    </div>
  );
}
