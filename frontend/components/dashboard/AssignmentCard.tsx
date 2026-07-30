"use client";

import React from "react";
import { AssignmentResponse, ResourceType, AssignmentStatus } from "@/lib/api";

interface AssignmentCardProps {
  assignment?: AssignmentResponse;
  title?: string;
  assignedTo?: string;
  resourceType?: ResourceType;
  status?: AssignmentStatus | string;
  etaMinutes?: number;
  onStatusChange?: (id: string, newStatus: AssignmentStatus) => void;
}

export function AssignmentCard({
  assignment,
  title = "Emergency Rescue Task",
  assignedTo = "Unassigned Unit",
  resourceType = "rescue_team",
  status = "assigned",
  etaMinutes = 10,
  onStatusChange,
}: AssignmentCardProps) {
  const currentStatus = assignment?.status || status;
  const currentAssignedTo = assignment ? `${assignment.resource_type}: ${assignment.resource_id}` : assignedTo;
  const currentEta = assignment?.eta_minutes ?? etaMinutes;

  const getStatusBadge = (st: string) => {
    switch (st.toLowerCase()) {
      case "en_route":
        return "bg-amber-600 text-white font-bold";
      case "completed":
        return "bg-emerald-600 text-white font-bold";
      case "cancelled":
        return "bg-slate-700 text-slate-400 font-medium";
      default:
        return "bg-blue-600 text-white font-bold";
    }
  };

  return (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-sm font-bold text-slate-100">{title}</h4>
          <p className="text-xs text-slate-400 mt-0.5">{currentAssignedTo}</p>
        </div>
        <span className={`text-[10px] px-2.5 py-1 rounded uppercase tracking-wider ${getStatusBadge(currentStatus)}`}>
          {currentStatus}
        </span>
      </div>

      <div className="flex justify-between items-center text-xs text-slate-300 pt-2 border-t border-slate-900">
        <span className="flex items-center gap-1 font-mono text-blue-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ETA: {currentEta} mins
        </span>

        {assignment && onStatusChange && (
          <select
            value={currentStatus}
            onChange={(e) => onStatusChange(assignment.id, e.target.value as AssignmentStatus)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="assigned">Assigned</option>
            <option value="en_route">En Route</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}
      </div>
    </div>
  );
}
