"use client";

import React from "react";
import { Activity, WifiOff, RefreshCw } from "lucide-react";
import { ConnectionStatus as SocketStatus } from "@/lib/socket";

interface ConnectionStatusProps {
  status: SocketStatus;
  lastUpdated?: string | null;
  className?: string;
}

export function ConnectionStatus({
  status,
  lastUpdated,
  className = "",
}: ConnectionStatusProps) {
  if (status === "connected") {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/60 rounded-full text-xs font-semibold text-emerald-400 ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Activity className="w-3.5 h-3.5" />
        <span>LIVE</span>
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 bg-amber-950/40 border border-amber-800/60 rounded-full text-xs font-semibold text-amber-400 ${className}`}
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Reconnecting...</span>
      </div>
    );
  }

  if (status === "fallback_polling") {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 bg-amber-950/40 border border-amber-800/60 rounded-full text-xs font-semibold text-amber-400 ${className}`}
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Polling (10s)</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 bg-red-950/40 border border-red-800/60 rounded-full text-xs font-semibold text-red-400 ${className}`}
    >
      <WifiOff className="w-3.5 h-3.5" />
      <span>OFFLINE</span>
      {lastUpdated && (
        <span className="text-[10px] text-red-400/70 font-normal">
          ({lastUpdated})
        </span>
      )}
    </div>
  );
}
