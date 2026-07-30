"use client";

import React from "react";
import { ShieldCheck, AlertOctagon, Inbox } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: "clear" | "error" | "empty";
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = "empty",
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  const icons = {
    clear: <ShieldCheck className="w-10 h-10 text-emerald-400" />,
    error: <AlertOctagon className="w-10 h-10 text-red-400" />,
    empty: <Inbox className="w-10 h-10 text-slate-500" />,
  };

  const bgGlow = {
    clear: "bg-emerald-500/10 border-emerald-500/20",
    error: "bg-red-500/10 border-red-500/20",
    empty: "bg-slate-800/40 border-slate-700/40",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center border rounded-card bg-surface-primary/60 ${bgGlow[icon]} ${className}`}
    >
      <div className="p-3 rounded-full mb-3 bg-slate-900/80 border border-slate-800 shadow-inner">
        {icons[icon]}
      </div>
      <h3 className="text-sm font-bold text-slate-200">{title}</h3>
      {description && (
        <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
