"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import {
  EmergencyRequestResponse,
  RequestRecommendations,
  RecommendationCandidate,
  RescueTeam,
  Ambulance,
  Hospital,
  Volunteer,
} from "@/lib/api";
import { RouteLine } from "./RouteLine";

export interface LeafletMapProps {
  teams?: RescueTeam[];
  ambulances?: Ambulance[];
  hospitals?: Hospital[];
  volunteers?: Volunteer[];
  selectedRequest?: EmergencyRequestResponse | null;
  recommendations?: RequestRecommendations;
  onSelectRequest?: (req: EmergencyRequestResponse) => void;
  allRequests?: EmergencyRequestResponse[];
  center?: [number, number];
  zoom?: number;
}

const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];

// Helper to convert GeoJSON [lng, lat] to Leaflet [lat, lng]
function geoToLatLng(coords: [number, number]): [number, number] {
  return [coords[1], coords[0]];
}

const LeafletMapInner = dynamic(
  async () => {
    const L = await import("leaflet");
    const { MapContainer, TileLayer, Marker, Popup, useMap } = await import(
      "react-leaflet"
    );

    // Custom Icon Generators using Leaflet DivIcons

    // Severity marker fill colors — duplicated from app/globals.css --severity-* variables.
    // Leaflet DivIcons render outside React's style pipeline, so CSS vars cannot be resolved
    // at icon-creation time. These hex values MUST be kept in sync with globals.css.
    const SEVERITY_MARKER_COLORS: Record<string, string> = {
      critical: "#dc2626",
      high:     "#f97316",
      medium:   "#eab308",
      low:      "#3b82f6",
    };

    const createMarkerIcon = (
      type: "team" | "ambulance" | "hospital" | "volunteer" | "request",
      status: string = "available",
      isTopCandidate: boolean = false,
      severity?: string
    ) => {
      let bg = "#3b82f6";
      let iconSymbol = "📍";
      let borderRadius = "50%";
      const isAvailable = status === "available" || status === "pending";
      const opacity = isAvailable ? "1.0" : "0.5";

      switch (type) {
        case "team":
          bg = "#3b82f6"; // Blue Circle
          iconSymbol = "🚒";
          borderRadius = "50%";
          break;
        case "ambulance":
          bg = "#ef4444"; // Red Diamond
          iconSymbol = "🚑";
          borderRadius = "20%";
          break;
        case "hospital":
          bg = "#10b981"; // Emerald Cross
          iconSymbol = "🏥";
          borderRadius = "8px";
          break;
        case "volunteer":
          bg = "#f59e0b"; // Amber Star
          iconSymbol = "🙋";
          borderRadius = "50%";
          break;
        case "request":
          // Severity-aware fill — falls back to critical red if severity is unknown
          bg = SEVERITY_MARKER_COLORS[severity ?? "critical"] ?? "#dc2626";
          iconSymbol = "🚨";
          borderRadius = "50%";
          break;
      }

      const topHalo = isTopCandidate
        ? "outline: 3px solid #eab308; outline-offset: 2px; box-shadow: 0 0 16px rgba(234, 179, 8, 0.9);"
        : `box-shadow: 0 4px 12px ${bg}88;`;

      const html = `
        <div style="
          width: 32px;
          height: 32px;
          background: ${bg};
          border: 2px solid #ffffff;
          border-radius: ${borderRadius};
          opacity: ${opacity};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: white;
          cursor: pointer;
          transition: transform 0.2s ease;
          ${topHalo}
        ">
          ${iconSymbol}
        </div>
      `;

      return L.divIcon({
        className: "custom-dashboard-marker",
        html,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });
    };

    const createSelectedRequestIcon = (severity?: string) => {
      // Severity-aware fill — falls back to critical red if severity is unknown
      const color = SEVERITY_MARKER_COLORS[severity ?? "critical"] ?? "#dc2626";
      const html = `
        <div style="position: relative; width: 44px; height: 44px;">
          <div style="
            position: absolute;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: ${color}66;
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            position: absolute;
            top: 6px;
            left: 6px;
            width: 32px;
            height: 32px;
            background: ${color};
            border: 3px solid #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 0 24px ${color}f2;
          ">
            🚨
          </div>
        </div>
      `;
      return L.divIcon({
        className: "custom-selected-request-marker",
        html,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22],
      });
    };

    function MapController({ centerPos }: { centerPos: [number, number] }) {
      const map = useMap();
      useEffect(() => {
        if (centerPos) {
          map.panTo(centerPos, { animate: true, duration: 0.8 });
        }
      }, [centerPos, map]);
      return null;
    }

    return function InnerDashboardMap({
      teams = [],
      ambulances = [],
      hospitals = [],
      volunteers = [],
      selectedRequest,
      recommendations,
      onSelectRequest,
      allRequests = [],
      center = DEFAULT_CENTER,
      zoom = 13,
    }: LeafletMapProps) {
      // Find top candidate coordinates for selected request
      const selectedReqCoords = selectedRequest
        ? geoToLatLng(selectedRequest.location.coordinates)
        : null;

      const topCandidateRoutes: Array<{
        id: string;
        label: string;
        geometry?: { type: "LineString"; coordinates: [number, number][] } | null;
        fallbackCoords: [number, number][];
      }> = [];
      const topCandidateIds = new Set<string>();

      if (selectedReqCoords && recommendations) {
        const addCategoryRoutes = (
          candidates: RecommendationCandidate[] = [],
          resources: Array<{ id: string; location: { coordinates: [number, number] } }>,
          labelPrefix: string
        ) => {
          candidates.slice(0, 2).forEach((cand) => {
            topCandidateIds.add(cand.resource_id);
            const match = resources.find((r) => r.id === cand.resource_id);
            if (match) {
              topCandidateRoutes.push({
                id: cand.resource_id,
                label: `${labelPrefix}: ${cand.name}`,
                geometry: cand.route_geometry,
                fallbackCoords: [
                  selectedReqCoords,
                  geoToLatLng(match.location.coordinates),
                ],
              });
            }
          });
        };

        addCategoryRoutes(recommendations.rescue_teams, teams, "Team");
        addCategoryRoutes(recommendations.ambulances, ambulances, "Ambulance");
        addCategoryRoutes(recommendations.hospitals, hospitals, "Hospital");
        addCategoryRoutes(recommendations.volunteers, volunteers, "Volunteer");
      }

      // Map center priority: Selected Request position > explicit center prop > default
      const activeCenter = selectedReqCoords || center;

      return (
        <div className="relative w-full h-full min-h-[480px] rounded-card overflow-hidden border border-[var(--border-primary)] shadow-2xl bg-surface-primary">
          <MapContainer
            center={activeCenter}
            zoom={zoom}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
          >
            {/* CartoDB Dark Matter Tiles (free, dark-mode matching) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <MapController centerPos={activeCenter} />

            {/* Connecting OSRM road routes from selected request to top recommended candidates */}
            {topCandidateRoutes.map((route) => (
              <RouteLine
                key={`route-${route.id}`}
                geometry={route.geometry}
                fallbackPositions={route.fallbackCoords}
                color="#eab308"
                weight={4}
                opacity={0.9}
              />
            ))}

            {/* Rescue Teams */}
            {teams.map((t) => {
              const pos = geoToLatLng(t.location.coordinates);
              const isTop = topCandidateIds.has(t.id);
              return (
                <Marker
                  key={`team-${t.id}`}
                  position={pos}
                  icon={createMarkerIcon("team", t.status, isTop)}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 space-y-1 text-slate-900 font-sans">
                      <div className="font-bold text-sm flex items-center gap-1 text-blue-600">
                        <span>🚒</span> {t.name}
                      </div>
                      <div className="text-xs font-semibold text-slate-700">
                        Type: <span className="uppercase">{t.type}</span>
                      </div>
                      <div className="text-xs">
                        Status:{" "}
                        <span
                          className={`font-bold ${
                            t.status === "available"
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      {t.skills && t.skills.length > 0 && (
                        <div className="text-[11px] text-slate-600">
                          Skills: {t.skills.join(", ")}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Ambulances */}
            {ambulances.map((a) => {
              const pos = geoToLatLng(a.location.coordinates);
              const isTop = topCandidateIds.has(a.id);
              return (
                <Marker
                  key={`amb-${a.id}`}
                  position={pos}
                  icon={createMarkerIcon("ambulance", a.status, isTop)}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 space-y-1 text-slate-900 font-sans">
                      <div className="font-bold text-sm flex items-center gap-1 text-red-600">
                        <span>🚑</span> {a.driver_name}
                      </div>
                      <div className="text-xs font-mono">
                        Plate: {a.plate_number}
                      </div>
                      <div className="text-xs">
                        Status:{" "}
                        <span
                          className={`font-bold ${
                            a.status === "available"
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Hospitals */}
            {hospitals.map((h) => {
              const pos = geoToLatLng(h.location.coordinates);
              const isTop = topCandidateIds.has(h.id);
              const hasBeds = h.available_beds > 0;
              return (
                <Marker
                  key={`hosp-${h.id}`}
                  position={pos}
                  icon={createMarkerIcon(
                    "hospital",
                    hasBeds ? "available" : "busy",
                    isTop
                  )}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 space-y-1 text-slate-900 font-sans">
                      <div className="font-bold text-sm flex items-center gap-1 text-emerald-600">
                        <span>🏥</span> {h.name}
                      </div>
                      <div className="text-xs">Phone: {h.phone}</div>
                      <div className="text-xs font-semibold text-emerald-700">
                        Beds: {h.available_beds} / {h.total_beds} available
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Volunteers */}
            {volunteers.map((v) => {
              const pos = geoToLatLng(v.location.coordinates);
              const isTop = topCandidateIds.has(v.id);
              return (
                <Marker
                  key={`vol-${v.id}`}
                  position={pos}
                  icon={createMarkerIcon("volunteer", v.status, isTop)}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 space-y-1 text-slate-900 font-sans">
                      <div className="font-bold text-sm flex items-center gap-1 text-amber-600">
                        <span>🙋</span> {v.name}
                      </div>
                      <div className="text-xs text-slate-600">{v.email}</div>
                      <div className="text-xs">
                        Status:{" "}
                        <span
                          className={`font-bold ${
                            v.status === "available"
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {v.status}
                        </span>
                      </div>
                      {v.skills && v.skills.length > 0 && (
                        <div className="text-[11px] text-slate-600">
                          Skills: {v.skills.join(", ")}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* All unselected requests stream markers */}
            {allRequests
              .filter((r) => !selectedRequest || r.id !== selectedRequest.id)
              .map((req) => {
                const pos = geoToLatLng(req.location.coordinates);
                const severityColor = SEVERITY_MARKER_COLORS[req.severity] ?? "#dc2626";
                return (
                  <Marker
                    key={`req-${req.id}`}
                    position={pos}
                    icon={createMarkerIcon("request", req.status, false, req.severity)}
                    eventHandlers={{
                      click: () => onSelectRequest && onSelectRequest(req),
                    }}
                  >
                    <Popup className="custom-leaflet-popup">
                      <div className="p-1 space-y-1 text-slate-900 font-sans">
                        <div className="font-bold text-xs uppercase flex justify-between gap-2" style={{ color: severityColor }}>
                          <span>🚨 {req.category}</span>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            background: `${severityColor}22`,
                            color: severityColor,
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}>
                            <span style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: severityColor,
                              display: "inline-block",
                              flexShrink: 0,
                            }} />
                            {req.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700">{req.description}</p>
                        <button
                          type="button"
                          onClick={() => onSelectRequest && onSelectRequest(req)}
                          className="w-full mt-1 py-1 text-white rounded text-[11px] font-bold cursor-pointer"
                          style={{ background: severityColor }}
                        >
                          Select Incident
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Selected Request Highlight Marker */}
            {selectedRequest && selectedReqCoords && (() => {
              const selColor = SEVERITY_MARKER_COLORS[selectedRequest.severity] ?? "#dc2626";
              return (
                <Marker position={selectedReqCoords} icon={createSelectedRequestIcon(selectedRequest.severity)}>
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 space-y-1 text-slate-900 font-sans">
                      <div className="font-extrabold text-xs uppercase flex items-center justify-between" style={{ color: selColor }}>
                        <span>🚨 SELECTED INCIDENT</span>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: `${selColor}22`,
                          color: selColor,
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}>
                          <span style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: selColor,
                            display: "inline-block",
                            flexShrink: 0,
                          }} />
                          {selectedRequest.severity}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-800 font-sans">
                        {selectedRequest.category}
                      </div>
                      <p className="text-xs text-slate-700">{selectedRequest.description}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })()}
          </MapContainer>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-[400] bg-surface-primary/90 backdrop-blur border border-[var(--border-primary)] p-3 rounded-card text-[11px] text-slate-300 space-y-1.5 shadow-2xl pointer-events-auto">
            <div className="font-bold text-slate-100 text-[10px] uppercase tracking-wider">
              Tactical Map Legend
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                Rescue Teams
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block"></span>
                Ambulances
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                Hospitals
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                Volunteers
              </span>
            </div>
            {recommendations && (
              <div className="pt-1.5 border-t border-[var(--border-primary)] text-[10px] text-yellow-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
                Yellow Route = AI Dispatch Route
              </div>
            )}
          </div>
        </div>
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[480px] rounded-card bg-surface-primary border border-[var(--border-primary)] flex items-center justify-center text-slate-400 text-sm">
        <div className="flex items-center gap-2.5 font-medium">
          <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          Initializing Tactical CartoDB Dark Map...
        </div>
      </div>
    ),
  }
);

export function LeafletMap(props: LeafletMapProps) {
  return <LeafletMapInner {...props} />;
}
