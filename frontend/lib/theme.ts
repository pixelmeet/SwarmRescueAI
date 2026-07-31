import { SeverityLevel } from "@/types";

export type Severity = "critical" | "high" | "medium" | "low";
export type ResourceStatus = "available" | "busy" | "offline";
export type RequestStatus = "pending" | "assigned" | "en_route" | "resolved";

export const THEME_PALETTE = {
  // Dark Background Scale
  bg: {
    base: "slate-950",
    surface: "slate-900",
    card: "slate-900/90",
    cardHover: "slate-900",
    border: "slate-800",
    subtleBorder: "slate-800/80",
  },
  // Unified Primary Accent
  primary: {
    main: "#3b82f6",
    hover: "#2563eb",
    muted: "rgba(59, 130, 246, 0.15)",
  },
  // Severity Palette
  severity: {
    critical: {
      text: "text-red-400",
      bg: "bg-red-950/60",
      border: "border-red-800",
      hex: "#dc2626",
    },
    high: {
      text: "text-orange-400",
      bg: "bg-orange-950/60",
      border: "border-orange-800",
      hex: "#f97316",
    },
    medium: {
      text: "text-amber-400",
      bg: "bg-amber-950/60",
      border: "border-amber-800",
      hex: "#eab308",
    },
    low: {
      text: "text-blue-400",
      bg: "bg-blue-950/60",
      border: "border-blue-800",
      hex: "#3b82f6",
    },
  },
  // Resource Status Palette
  resourceStatus: {
    available: {
      text: "text-emerald-400",
      bg: "bg-emerald-950/60",
      border: "border-emerald-800",
    },
    busy: {
      text: "text-amber-400",
      bg: "bg-amber-950/60",
      border: "border-amber-800",
    },
    offline: {
      text: "text-slate-400",
      bg: "bg-slate-900/60",
      border: "border-slate-800",
    },
  },
};

export function getSeverityColors(severity: Severity | SeverityLevel) {
  const normalized = (severity || "medium").toLowerCase() as Severity;
  return THEME_PALETTE.severity[normalized] || THEME_PALETTE.severity.medium;
}

export function getResourceStatusColors(status: ResourceStatus) {
  return THEME_PALETTE.resourceStatus[status] || THEME_PALETTE.resourceStatus.offline;
}
