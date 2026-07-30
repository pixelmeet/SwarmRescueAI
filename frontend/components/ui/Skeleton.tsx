"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-800/80 ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 bg-surface-primary border border-[var(--border-primary)] rounded-card space-y-3 shadow-lg">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-end pt-2">
        <Skeleton className="h-8 w-24 rounded-button" />
      </div>
    </div>
  );
}

export function QueueSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-4 bg-surface-primary border border-[var(--border-primary)] rounded-card space-y-2 shadow-md">
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-7 w-1/3" />
      <Skeleton className="h-2 w-2/3" />
    </div>
  );
}
