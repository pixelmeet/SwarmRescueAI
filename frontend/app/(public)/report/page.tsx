import React from "react";
import { EmergencyReportForm } from "@/components/forms/EmergencyReportForm";
import { ShieldAlert, PhoneCall } from "lucide-react";

export const metadata = {
  title: "Report Emergency | SwarmRescue AI",
  description:
    "Submit urgent emergency requests for immediate multi-agent triage & resource coordination.",
};

export default function ReportEmergencyPage() {
  return (
    <main className="min-h-screen bg-background text-slate-100 px-4 py-8 md:py-12 flex flex-col justify-center">
      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* High-Contrast Urgent Header */}
        <header className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-red-950/80 border border-red-700/80 rounded-full text-red-400 text-xs font-bold uppercase tracking-wider shadow-inner">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            Public Emergency Reporting Portal
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <ShieldAlert className="w-8 h-8 text-red-500 shrink-0 animate-pulse" />
            SwarmRescue AI Intake
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Report an active incident or crisis. Our AI system will automatically classify severity and notify nearest rescue units in real time.
          </p>
        </header>

        {/* Emergency Form Card Container */}
        <section className="bg-surface-primary/90 border border-[var(--border-primary)] rounded-card p-6 md:p-8 shadow-2xl backdrop-blur">
          <EmergencyReportForm />
        </section>

        {/* Footer info */}
        <footer className="text-center text-[11px] text-slate-500 space-y-1.5 pt-2">
          <p className="flex items-center justify-center gap-1.5 text-slate-400 font-medium">
            <PhoneCall className="w-3.5 h-3.5 text-red-400" />
            If you are in immediate life-threatening danger, also call 911 / 112 directly.
          </p>
          <p className="font-mono text-slate-600">
            SwarmRescue AI Operational Network &bull; Response Node v1.0
          </p>
        </footer>
      </div>
    </main>
  );
}
