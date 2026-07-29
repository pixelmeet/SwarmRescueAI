"use client";

import React from "react";

export function EmergencyReportForm() {
  return (
    <form className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
          Emergency Description
        </label>
        <textarea
          className="w-full p-3 bg-slate-950 border border-slate-800 rounded text-slate-200 text-sm"
          placeholder="Describe the situation..."
          rows={4}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
          Contact Number
        </label>
        <input
          type="text"
          className="w-full p-3 bg-slate-950 border border-slate-800 rounded text-slate-200 text-sm"
          placeholder="+1 (555) 000-0000"
        />
      </div>
      <button
        type="button"
        className="w-full py-3 bg-red-600 hover:bg-red-700 font-bold text-white rounded transition"
      >
        Submit Emergency Request
      </button>
    </form>
  );
}
