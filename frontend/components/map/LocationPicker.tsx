"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

export interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number };
}

// Default fallback coordinates
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

// Dynamically import Leaflet elements to prevent SSR window reference errors
const LeafletMapInner = dynamic(
  async () => {
    const L = await import("leaflet");
    const { MapContainer, TileLayer, Marker, useMapEvents, useMap } = await import("react-leaflet");

    const customMarkerIcon = L.divIcon({
      className: "custom-leaflet-marker",
      html: `<div style="
        width: 32px;
        height: 32px;
        background: #ef4444;
        border: 3px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(239,68,68,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    function MapUpdater({ center }: { center: { lat: number; lng: number } }) {
      const map = useMap();
      useEffect(() => {
        map.setView([center.lat, center.lng], map.getZoom() || 14);
      }, [center, map]);
      return null;
    }

    function MapEvents({ onSelect }: { onSelect: (coords: { lat: number; lng: number }) => void }) {
      useMapEvents({
        click(e) {
          onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
      });
      return null;
    }

    return function InnerMap({
      location,
      onLocationChange,
      isGeolocating,
      onTriggerGeolocate,
    }: {
      location: { lat: number; lng: number };
      onLocationChange: (loc: { lat: number; lng: number }) => void;
      isGeolocating: boolean;
      onTriggerGeolocate: () => void;
    }) {
      const markerRef = useRef<L.Marker>(null);

      const eventHandlers = useMemo(
        () => ({
          dragend() {
            const marker = markerRef.current;
            if (marker != null) {
              const latLng = marker.getLatLng();
              onLocationChange({ lat: latLng.lat, lng: latLng.lng });
            }
          },
        }),
        [onLocationChange]
      );

      return (
        <div className="relative w-full h-[280px] sm:h-[360px] rounded-lg overflow-hidden border border-slate-800 shadow-inner">
          <MapContainer
            center={[location.lat, location.lng]}
            zoom={14}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={location} />
            <MapEvents onSelect={onLocationChange} />
            <Marker
              draggable={true}
              eventHandlers={eventHandlers}
              position={[location.lat, location.lng]}
              icon={customMarkerIcon}
              ref={markerRef}
            />
          </MapContainer>

          {/* Action Overlay with >=44px tap targets */}
          <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
            <button
              type="button"
              onClick={onTriggerGeolocate}
              disabled={isGeolocating}
              className="px-3.5 py-2.5 min-h-[44px] min-w-[44px] bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 rounded-md text-xs font-semibold backdrop-blur shadow-md flex items-center justify-center gap-1.5 transition disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 text-red-500 ${isGeolocating ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{isGeolocating ? "Detecting..." : "My Location"}</span>
            </button>
          </div>

          <div className="absolute bottom-2 left-2 z-[400] bg-slate-950/85 backdrop-blur px-2.5 py-1 rounded text-[11px] text-slate-300 font-mono border border-slate-800">
            Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
          </div>
        </div>
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[280px] sm:h-[360px] rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-red-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Initializing Emergency Map...
        </div>
      </div>
    ),
  }
);

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number }>(
    initialLocation || DEFAULT_CENTER
  );
  const [isGeolocating, setIsGeolocating] = useState<boolean>(false);
  const [geoStatus, setGeoStatus] = useState<string>("");

  const handleLocationUpdate = (newLoc: { lat: number; lng: number }) => {
    setLocation(newLoc);
    onLocationSelect(newLoc);
  };

  const triggerGeolocation = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setIsGeolocating(true);
      setGeoStatus("Attempting browser geolocation...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          handleLocationUpdate(userLoc);
          setIsGeolocating(false);
          setGeoStatus("Location detected successfully.");
        },
        (error) => {
          console.warn("Geolocation warning:", error.message);
          setIsGeolocating(false);
          setGeoStatus("Default location set. Drag marker or click map to adjust.");
          handleLocationUpdate(DEFAULT_CENTER);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      setGeoStatus("Default location set. Click map to adjust location.");
      handleLocationUpdate(DEFAULT_CENTER);
    }
  };

  useEffect(() => {
    if (!initialLocation) {
      triggerGeolocation();
    } else {
      onLocationSelect(initialLocation);
    }
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-slate-300 uppercase tracking-wider">
          Pin Incident Location
        </span>
        <span className="text-slate-400 italic">Drag marker or tap map</span>
      </div>

      <LeafletMapInner
        location={location}
        onLocationChange={handleLocationUpdate}
        isGeolocating={isGeolocating}
        onTriggerGeolocate={triggerGeolocation}
      />

      {geoStatus && (
        <p className="text-[11px] text-slate-400 italic flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500"></span>
          {geoStatus}
        </p>
      )}
    </div>
  );
}
