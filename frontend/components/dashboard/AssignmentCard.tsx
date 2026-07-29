import React from "react";

interface AssignmentCardProps {
  title?: string;
  assignedTo?: string;
  status?: string;
}

export function AssignmentCard({
  title = "Emergency Task",
  assignedTo = "Unassigned",
  status = "Pending",
}: AssignmentCardProps) {
  return (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded space-y-2">
      <div className="flex justify-between items-center text-sm font-bold">
        <span>{title}</span>
        <span className="text-xs px-2 py-0.5 bg-blue-900/60 text-blue-300 rounded">{status}</span>
      </div>
      <p className="text-xs text-slate-400">Assigned Unit: {assignedTo}</p>
    </div>
  );
}
