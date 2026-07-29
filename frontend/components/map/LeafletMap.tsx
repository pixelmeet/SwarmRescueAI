import React from "react";

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
}

export function LeafletMap({ center = [12.9716, 77.5946], zoom = 13 }: LeafletMapProps) {
  return (
    <div className="w-full h-full min-h-[300px] bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-slate-500">
      [LeafletMap Placeholder - Lat: {center[0]}, Lng: {center[1]}, Zoom: {zoom}]
    </div>
  );
}
