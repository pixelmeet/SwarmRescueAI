"use client";

import React from "react";
import { Polyline } from "react-leaflet";

export interface RouteLineProps {
  geometry?: {
    type: "LineString";
    coordinates: [number, number][];
  } | null;
  fallbackPositions?: [number, number][];
  color?: string;
  weight?: number;
  dashArray?: string;
  opacity?: number;
}

export function RouteLine({
  geometry,
  fallbackPositions,
  color = "#eab308", // Golden Yellow
  weight = 4,
  dashArray = "6, 6",
  opacity = 0.9,
}: RouteLineProps) {
  let positions: [number, number][] = [];

  if (geometry && geometry.coordinates && geometry.coordinates.length > 0) {
    // GeoJSON [lng, lat] to Leaflet [lat, lng]
    positions = geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  } else if (fallbackPositions && fallbackPositions.length >= 2) {
    positions = fallbackPositions;
  }

  if (positions.length < 2) {
    return null;
  }

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color,
        weight,
        dashArray,
        opacity,
      }}
    />
  );
}
