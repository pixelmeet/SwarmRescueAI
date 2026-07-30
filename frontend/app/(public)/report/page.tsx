import React from "react";
import { EmergencyReportForm } from "@/components/forms/EmergencyReportForm";

export const metadata = {
  title: "Report Emergency | SwarmRescue AI",
  description: "Submit urgent emergency requests for immediate swarm rescue & resource coordination.",
};

export default function ReportEmergencyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-6 md:py-12">
      <div className="max-w-xl mx-auto space-y-6">
        {/* High-Contrast Urgent Header */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/80 border border-red-700/80 rounded-full text-red-400 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            Public Emergency Reporting Portal
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            SwarmRescue AI Report
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Report an immediate incident or crisis. Our AI system will automatically classify severity and dispatch nearest rescue units.
          </p>
        </header>

        {/* Emergency Form Card Container */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-8 shadow-2xl backdrop-blur">
          <EmergencyReportForm />
        </section>

        {/* Footer info */}
        <footer className="text-center text-[11px] text-slate-400 space-y-1">
          <p>If you are in immediate life-threatening danger, also attempt contacting local emergency services (911 / 112).</p>
          <p className="font-mono text-slate-400">SwarmRescue AI Operational Network &bull; Response Node v1.0</p>
        </footer>
      </div>
    </main>
  );
}
