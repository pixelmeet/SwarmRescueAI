"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Radio,
  Truck,
  BarChart3,
  Activity,
  ArrowRight,
  Sparkles,
  MapPin,
  Cpu,
  Zap,
} from "lucide-react";

export default function HomePage() {
  const [healthStatus, setHealthStatus] = useState<"healthy" | "offline" | "checking">("checking");

  useEffect(() => {
    async function checkHealth() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${backendUrl}/health`, { method: "GET", cache: "no-store" });
        if (res.ok) {
          setHealthStatus("healthy");
        } else {
          setHealthStatus("offline");
        }
      } catch (err) {
        setHealthStatus("offline");
      }
    }
    checkHealth();
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-slate-100 flex flex-col justify-between overflow-hidden">
      {/* Background Decorative Radial Gradients & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_120%,rgba(239,68,68,0.1),rgba(255,255,255,0))] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400 shadow-lg shadow-red-950/50 animate-pulse-glow">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-slate-100 tracking-tight block leading-none">
              SwarmRescue<span className="text-primary">AI</span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              Multi-Agent Emergency Response
            </span>
          </div>
        </div>

        {/* System Health Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-primary border border-[var(--border-primary)] text-xs font-mono">
          {healthStatus === "healthy" ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-bold">SYSTEM ONLINE</span>
            </>
          ) : healthStatus === "offline" ? (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
              <span className="text-red-400 font-bold">BACKEND OFFLINE</span>
            </>
          ) : (
            <>
              <Activity className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span className="text-amber-400 font-bold">CHECKING STATUS...</span>
            </>
          )}
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-5xl mx-auto space-y-10">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/60 border border-red-800/80 text-red-400 text-xs font-bold uppercase tracking-wider shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            AI Triage & Dynamic Dispatch Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Autonomous Disaster Coordination & Triage System
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
            Coordinating disaster rescue efforts with real-time geospatial tracking, Groq LLM report classification, multi-criteria scoring dispatch engines, and multi-tier field units.
          </p>
        </div>

        {/* 4 Main Action Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full text-left">
          {/* Card 1: Citizen Report */}
          <Link
            href="/report"
            className="group relative p-6 rounded-card bg-surface-primary/80 border border-[var(--border-primary)] hover:border-red-500/60 hover:bg-surface-primary transition-all duration-normal shadow-xl flex flex-col justify-between space-y-4 hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-100 group-hover:text-red-400 transition-colors flex items-center justify-between">
                Report Emergency
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-red-400" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Public intake form for citizens. Real-time pin drop location picker & LLM auto-triage preview.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-mono text-red-400/80 font-bold uppercase tracking-wider border-t border-slate-800/80">
              PUBLIC INTAKE PORTAL &rarr;
            </div>
          </Link>

          {/* Card 2: Admin Command Center */}
          <Link
            href="/admin"
            className="group relative p-6 rounded-card bg-surface-primary/80 border border-[var(--border-primary)] hover:border-primary/60 hover:bg-surface-primary transition-all duration-normal shadow-xl flex flex-col justify-between space-y-4 hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary-muted border border-blue-800 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-100 group-hover:text-primary transition-colors flex items-center justify-between">
                Command Center
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dispatcher tactical center. CartoDB dark map, live request queue, AI scoring engine, & unit dispatching.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-mono text-primary/80 font-bold uppercase tracking-wider border-t border-slate-800/80">
              DISPATCHER DASHBOARD &rarr;
            </div>
          </Link>

          {/* Card 3: Responder Portal */}
          <Link
            href="/team"
            className="group relative p-6 rounded-card bg-surface-primary/80 border border-[var(--border-primary)] hover:border-emerald-500/60 hover:bg-surface-primary transition-all duration-normal shadow-xl flex flex-col justify-between space-y-4 hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-100 group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                Responder Portal
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-400" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mobile-optimized interface for field rescue teams, ambulances, and volunteers. Update status en-route to resolution.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-mono text-emerald-400/80 font-bold uppercase tracking-wider border-t border-slate-800/80">
              FIELD UNIT TASK VIEW &rarr;
            </div>
          </Link>

          {/* Card 4: Post-Mission Analytics */}
          <Link
            href="/analytics"
            className="group relative p-6 rounded-card bg-surface-primary/80 border border-[var(--border-primary)] hover:border-violet-500/60 hover:bg-surface-primary transition-all duration-normal shadow-xl flex flex-col justify-between space-y-4 hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-violet-950/80 border border-violet-800 text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-100 group-hover:text-violet-400 transition-colors flex items-center justify-between">
                Analytics
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-violet-400" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Performance insights & statistics. Triage-to-assignment response times, severity distribution, and resource utilization.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-mono text-violet-400/80 font-bold uppercase tracking-wider border-t border-slate-800/80">
              POST-MISSION METRICS &rarr;
            </div>
          </Link>
        </div>
      </main>

      {/* Platform Features Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 font-medium text-slate-400">
            <Cpu className="w-4 h-4 text-primary" />
            Groq Llama-3.3 LLM Triage
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-400">
            <Zap className="w-4 h-4 text-amber-400" />
            Weighted Scoring Engine
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-400">
            <MapPin className="w-4 h-4 text-emerald-400" />
            OSRM Routing & Geospatial MongoDB
          </span>
        </div>
        <div className="font-mono text-[11px]">
          SwarmRescue AI Platform &bull; v1.0.0
        </div>
      </footer>
    </div>
  );
}
