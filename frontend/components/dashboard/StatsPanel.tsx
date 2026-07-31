"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Truck, Building2, Users, RefreshCw } from "lucide-react";
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
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCardSkeleton } from "@/components/ui/Skeleton";

export function StatsPanel() {
  const [requests, setRequests] = useState<EmergencyRequestResponse[]>([]);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, teamRes, ambRes, hospRes, volRes] = await Promise.all([
        listRequests(),
        listTeams(),
        listAmbulances(),
        listHospitals(),
        listVolunteers(),
      ]);
      setRequests(reqRes);
      setTeams(teamRes);
      setAmbulances(ambRes);
      setHospitals(hospRes);
      setVolunteers(volRes);
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
      setError(err instanceof Error ? err.message : "Failed to load telemetry stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="error"
        title="Failed to Load Telemetry Stats"
        description={error}
        actionLabel="Retry Loading"
        onAction={loadStats}
        className="py-6"
      />
    );
  }

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

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Active Emergencies */}
      <Card padding="sm" className="hover:border-slate-700 transition-colors">
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
      </Card>

      {/* Dispatched Units */}
      <Card padding="sm" className="hover:border-slate-700 transition-colors">
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
      </Card>

      {/* Available Beds */}
      <Card padding="sm" className="hover:border-slate-700 transition-colors">
        <div className="flex justify-between items-start">
          <div className="text-3xl font-extrabold text-emerald-400 font-telemetry tracking-tight">
            {totalAvailableBeds}
          </div>
          <Building2 className="w-5 h-5 text-emerald-400/50" />
        </div>
        <div className="text-xs text-slate-400 font-medium mt-2">
          Available Hospital Beds
        </div>
      </Card>

      {/* Active Volunteers */}
      <Card padding="sm" className="hover:border-slate-700 transition-colors">
        <div className="flex justify-between items-start">
          <div className="text-3xl font-extrabold text-amber-400 font-telemetry tracking-tight">
            {volunteers.length}
          </div>
          <Users className="w-5 h-5 text-amber-400/50" />
        </div>
        <div className="text-xs text-slate-400 font-medium mt-2">
          Active Volunteers
        </div>
      </Card>
    </div>
  );
}
