import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const styles = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    success: "bg-emerald-950 text-emerald-300 border-emerald-800",
    warning: "bg-amber-950 text-amber-300 border-amber-800",
    danger: "bg-red-950 text-red-300 border-red-800",
  };

  return (
    <span className={`inline-block px-2 py-0.5 text-xs border rounded font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}
