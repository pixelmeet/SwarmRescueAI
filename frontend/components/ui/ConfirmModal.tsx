"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./Button";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  details?: {
    resourceName?: string;
    requestDescription?: string;
    eta?: string | number | null;
  };
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  details,
  confirmText = "Confirm Dispatch",
  cancelText = "Cancel",
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-surface-primary border border-[var(--border-primary)] rounded-card shadow-2xl p-6 space-y-4">
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">{title}</h3>
            {description && (
              <p className="text-xs text-slate-400 mt-1">{description}</p>
            )}
          </div>
        </div>

        {details && (
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-2 font-mono">
            {details.resourceName && (
              <div className="flex justify-between">
                <span className="text-slate-400">Target Unit:</span>
                <span className="text-blue-400 font-semibold">{details.resourceName}</span>
              </div>
            )}
            {details.requestDescription && (
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">Emergency:</span>
                <span className="text-slate-200 truncate">{details.requestDescription}</span>
              </div>
            )}
            {details.eta !== undefined && details.eta !== null && (
              <div className="flex justify-between">
                <span className="text-slate-400">Est. ETA:</span>
                <span className="text-emerald-400 font-semibold">{details.eta} mins</span>
              </div>
            )}
          </div>
        )}

        <div className="p-2 bg-red-950/30 border border-red-900/40 rounded text-[11px] text-red-400">
          ⚠️ <strong>Action Notice:</strong> This dispatches operational personnel/units in real time.
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
