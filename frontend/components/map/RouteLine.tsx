import React from "react";

interface RouteLineProps {
  coordinates: [number, number][];
}

export function RouteLine({ coordinates }: RouteLineProps) {
  return (
    <div className="text-xs text-blue-400">
      [RouteLine Placeholder - {coordinates.length} waypoints]
    </div>
  );
}
