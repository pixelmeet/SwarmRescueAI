import React from "react";

export function StatsPanel() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded text-center">
        <div className="text-2xl font-bold text-emerald-400">4.2m</div>
        <div className="text-xs text-slate-500">Avg Response</div>
      </div>
      <div className="p-4 bg-slate-950 border border-slate-800 rounded text-center">
        <div className="text-2xl font-bold text-red-400">18</div>
        <div className="text-xs text-slate-500">Active Emergencies</div>
      </div>
      <div className="p-4 bg-slate-950 border border-slate-800 rounded text-center">
        <div className="text-2xl font-bold text-blue-400">32</div>
        <div className="text-xs text-slate-500">Dispatched Units</div>
      </div>
    </div>
  );
}
