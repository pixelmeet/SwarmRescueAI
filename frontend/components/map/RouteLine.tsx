"use client";

import React from "react";
import dynamic from "next/dynamic";

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

const RouteLineInner = dynamic(
  async () => {
    const { Polyline } = await import("react-leaflet");
    return function InnerRouteLine({
      geometry,
      fallbackPositions,
      color = "#eab308",
      weight = 4,
      dashArray = "6, 6",
      opacity = 0.9,
    }: RouteLineProps) {
      let positions: [number, number][] = [];

      if (geometry && geometry.coordinates && geometry.coordinates.length > 0) {
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
    };
  },
  { ssr: false }
);

export function RouteLine(props: RouteLineProps) {
  return <RouteLineInner {...props} />;
}
