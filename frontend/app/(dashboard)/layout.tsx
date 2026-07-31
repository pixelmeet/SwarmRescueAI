"use client";

import React from "react";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { ToastProvider } from "@/components/ui/ToastContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardNav />
        <main className="flex-1">{children}</main>
      </div>
    </ToastProvider>
  );
}
