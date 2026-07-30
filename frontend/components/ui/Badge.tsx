"use client";

import React from "react";
import {
  AlertTriangle,
  AlertCircle,
  Zap,
  Info,
  CheckCircle,
  Loader,
  MinusCircle,
  Clock,
  ClipboardList,
  Navigation,
  CheckCircle2,
  Shield,
  Truck,
  Building2,
  Heart,
} from "lucide-react";

/* =============================================
   Severity Badge
   Always renders: color + icon + text (never color alone)
   ============================================= */

type Severity = "critical" | "high" | "medium" | "low";

const SEVERITY_CONFIG: Record<
  Severity,
  { icon: React.ElementType; label: string; classes: string }
> = {
  critical: {
    icon: AlertTriangle,
    label: "Critical",
    classes:
      "bg-severity-critical-bg text-severity-critical border-[var(--severity-critical-border)]",
  },
  high: {
    icon: AlertCircle,
    label: "High",
    classes:
      "bg-severity-high-bg text-severity-high border-[var(--severity-high-border)]",
  },
  medium: {
    icon: Zap,
    label: "Medium",
    classes:
      "bg-severity-medium-bg text-severity-medium border-[var(--severity-medium-border)]",
  },
  low: {
    icon: Info,
    label: "Low",
    classes:
      "bg-severity-low-bg text-severity-low border-[var(--severity-low-border)]",
  },
};

export function SeverityBadge({
  severity,
  pulse = false,
  size = "sm",
}: {
  severity: Severity;
  pulse?: boolean;
  size?: "xs" | "sm";
}) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium;
  const Icon = config.icon;
  const sizeClasses =
    size === "xs" ? "px-1.5 py-0.5 text-[10px] gap-1" : "px-2 py-0.5 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center border rounded-badge font-bold uppercase tracking-wider ${sizeClasses} ${config.classes} ${
        pulse && severity === "critical" ? "animate-pulse-glow" : ""
      }`}
    >
      <Icon className={size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {config.label}
    </span>
  );
}

/* =============================================
   Resource Status Badge
   ============================================= */

type ResourceStatus = "available" | "busy" | "offline";

const STATUS_CONFIG: Record<
  ResourceStatus,
  { icon: React.ElementType; label: string; classes: string }
> = {
  available: {
    icon: CheckCircle,
    label: "Available",
    classes: "bg-status-available-bg text-status-available border-emerald-800",
  },
  busy: {
    icon: Loader,
    label: "Busy",
    classes: "bg-status-busy-bg text-status-busy border-amber-800",
  },
  offline: {
    icon: MinusCircle,
    label: "Offline",
    classes: "bg-status-offline-bg text-status-offline border-slate-700",
  },
};

export function StatusBadge({
  status,
  size = "sm",
}: {
  status: ResourceStatus;
  size?: "xs" | "sm";
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
  const Icon = config.icon;
  const sizeClasses =
    size === "xs" ? "px-1.5 py-0.5 text-[10px] gap-1" : "px-2 py-0.5 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center border rounded-badge font-bold uppercase tracking-wider ${sizeClasses} ${config.classes}`}
    >
      <Icon className={size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {config.label}
    </span>
  );
}

/* =============================================
   Request Status Badge
   ============================================= */

type RequestStatus = "pending" | "assigned" | "en_route" | "resolved";

const REQUEST_STATUS_CONFIG: Record<
  RequestStatus,
  { icon: React.ElementType; label: string; classes: string }
> = {
  pending: {
    icon: Clock,
    label: "Pending",
    classes: "bg-amber-950/60 text-amber-400 border-amber-800",
  },
  assigned: {
    icon: ClipboardList,
    label: "Assigned",
    classes: "bg-blue-950/60 text-blue-400 border-blue-800",
  },
  en_route: {
    icon: Navigation,
    label: "En Route",
    classes: "bg-indigo-950/60 text-indigo-400 border-indigo-800",
  },
  resolved: {
    icon: CheckCircle2,
    label: "Resolved",
    classes: "bg-emerald-950/60 text-emerald-400 border-emerald-800",
  },
};

export function RequestStatusBadge({
  status,
  size = "sm",
}: {
  status: RequestStatus;
  size?: "xs" | "sm";
}) {
  const config = REQUEST_STATUS_CONFIG[status] || REQUEST_STATUS_CONFIG.pending;
  const Icon = config.icon;
  const sizeClasses =
    size === "xs" ? "px-1.5 py-0.5 text-[10px] gap-1" : "px-2 py-0.5 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center border rounded-badge font-bold uppercase tracking-wider ${sizeClasses} ${config.classes}`}
    >
      <Icon className={size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {config.label}
    </span>
  );
}

/* =============================================
   Category Badge
   ============================================= */

type Category = "fire" | "medical" | "trapped" | "flood" | "other";

const CATEGORY_CONFIG: Record<
  Category,
  { icon: React.ElementType; label: string; classes: string }
> = {
  fire: {
    icon: AlertTriangle,
    label: "Fire",
    classes: "bg-red-950/60 text-red-400 border-red-800",
  },
  medical: {
    icon: Heart,
    label: "Medical",
    classes: "bg-blue-950/60 text-blue-400 border-blue-800",
  },
  trapped: {
    icon: Shield,
    label: "Trapped",
    classes: "bg-amber-950/60 text-amber-400 border-amber-800",
  },
  flood: {
    icon: AlertCircle,
    label: "Flood",
    classes: "bg-cyan-950/60 text-cyan-400 border-cyan-800",
  },
  other: {
    icon: Info,
    label: "Other",
    classes: "bg-slate-800/60 text-slate-400 border-slate-700",
  },
};

export function CategoryBadge({
  category,
  size = "sm",
}: {
  category: Category;
  size?: "xs" | "sm";
}) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  const Icon = config.icon;
  const sizeClasses =
    size === "xs" ? "px-1.5 py-0.5 text-[10px] gap-1" : "px-2 py-0.5 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center border rounded-badge font-bold uppercase tracking-wider ${sizeClasses} ${config.classes}`}
    >
      <Icon className={size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {config.label}
    </span>
  );
}

/* =============================================
   Resource Type Badge
   ============================================= */

type ResourceType = "rescue_team" | "ambulance" | "hospital" | "volunteer";

const RESOURCE_TYPE_CONFIG: Record<
  ResourceType,
  { icon: React.ElementType; label: string; classes: string }
> = {
  rescue_team: {
    icon: Shield,
    label: "Rescue Team",
    classes: "bg-blue-950/60 text-blue-400 border-blue-800",
  },
  ambulance: {
    icon: Truck,
    label: "Ambulance",
    classes: "bg-red-950/60 text-red-400 border-red-800",
  },
  hospital: {
    icon: Building2,
    label: "Hospital",
    classes: "bg-emerald-950/60 text-emerald-400 border-emerald-800",
  },
  volunteer: {
    icon: Heart,
    label: "Volunteer",
    classes: "bg-amber-950/60 text-amber-400 border-amber-800",
  },
};

export function ResourceTypeBadge({
  resourceType,
  size = "sm",
}: {
  resourceType: ResourceType;
  size?: "xs" | "sm";
}) {
  const config = RESOURCE_TYPE_CONFIG[resourceType] || RESOURCE_TYPE_CONFIG.rescue_team;
  const Icon = config.icon;
  const sizeClasses =
    size === "xs" ? "px-1.5 py-0.5 text-[10px] gap-1" : "px-2 py-0.5 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center border rounded-badge font-bold uppercase tracking-wider ${sizeClasses} ${config.classes}`}
    >
      <Icon className={size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {config.label}
    </span>
  );
}

/* =============================================
   Generic Badge (backward-compatible)
   ============================================= */

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const styles = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    success: "bg-emerald-950/60 text-emerald-300 border-emerald-800",
    warning: "bg-amber-950/60 text-amber-300 border-amber-800",
    danger: "bg-red-950/60 text-red-300 border-red-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs border rounded-badge font-semibold ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
