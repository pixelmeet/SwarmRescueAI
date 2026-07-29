import React from "react";

interface RequestMarkerProps {
  id: string;
  position: [number, number];
  severity?: string;
}

export function RequestMarker({ id, position, severity = "medium" }: RequestMarkerProps) {
  return (
    <div className="text-xs p-1 bg-red-900/80 text-red-200 border border-red-700 rounded">
      [RequestMarker {id} - {severity}]
    </div>
  );
}
