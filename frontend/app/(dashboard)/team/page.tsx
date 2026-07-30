"use client";

import React, { useEffect, useState } from "react";
import { AssignmentCard } from "@/components/dashboard/AssignmentCard";
import { listRequests, listTeams, EmergencyRequestResponse, RescueTeam } from "@/lib/api";

export default function TeamDashboardPage() {
  const [assignedRequests, setAssignedRequests] = useState<EmergencyRequestResponse[]>([]);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeamData() {
      try {
        const [reqs, teamList] = await Promise.all([
          listRequests({ status: "assigned" }).catch(() => []),
          listTeams().catch(() => []),
        ]);
        setAssignedRequests(reqs);
        setTeams(teamList);
      } catch (err) {
        console.error("Team dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTeamData();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 bg-slate-950 min-h-screen text-slate-100">
      <header className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-extrabold text-emerald-400">Responder Portal</h1>
        <p className="text-slate-400 text-xs mt-1">Live active task assignments and unit dispatch status for field response teams.</p>
      </header>

      {/* Active Units */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Active Assigned Tasks ({assignedRequests.length})</h3>
        {loading ? (
          <p className="text-xs text-slate-400 animate-pulse">Loading active assignments...</p>
        ) : assignedRequests.length === 0 ? (
          <p className="text-xs text-slate-400">No active assigned emergency tasks at present.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedRequests.map((req) => (
              <AssignmentCard
                key={req.id}
                title={`${req.category.toUpperCase()} — ${req.severity.toUpperCase()}`}
                assignedTo={`Incident: ${req.description.substring(0, 40)}...`}
                status={req.status}
                etaMinutes={12}
              />
            ))}
          </div>
        )}
      </div>

      {/* Field Teams */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Rescue Team Roster ({teams.length})</h3>
        {loading ? (
          <p className="text-xs text-slate-400 animate-pulse">Loading team roster...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teams.map((team) => (
              <div key={team.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-200">{team.name}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Type: {team.type}</div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] rounded uppercase font-bold ${team.status === "available" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-amber-950 text-amber-400 border border-amber-800"}`}>
                  {team.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
