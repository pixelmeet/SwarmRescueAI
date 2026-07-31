"use client";

import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "inset" | "glass";
  padding?: "none" | "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Card({
  variant = "default",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  const variants = {
    default: "bg-surface-primary border border-[var(--border-primary)] rounded-card shadow-xl",
    elevated: "bg-surface-secondary border border-slate-700/80 rounded-card shadow-2xl",
    inset: "bg-slate-950/80 border border-slate-800 rounded-card shadow-inner",
    glass: "glass rounded-card shadow-xl",
  };

  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-6 md:p-8",
  };

  return (
    <div
      className={`${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
