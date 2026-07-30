"use client";

import React, { useState } from "react";
import { LocationPicker } from "../map/LocationPicker";
import { createRequest, EmergencyRequestResponse } from "@/lib/api";
import { validateEmergencyReport } from "@/lib/validators";

export function EmergencyReportForm() {
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [successResponse, setSuccessResponse] = useState<EmergencyRequestResponse | null>(null);

  const handleLocationSelect = (loc: { lat: number; lng: number }) => {
    setLocation(loc);
    // Clear location error when user picks a location
    if (formErrors.location) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated.location;
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    // Validate inputs
    const validation = validateEmergencyReport({
      description,
      reporter_email: reporterEmail,
      reporter_name: reporterName,
      location,
    });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      if (!location) throw new Error("Location is required.");

      // Submit GeoJSON location with description and reporter fields (no severity/category)
      const payload = {
        description: description.trim(),
        reporter_name: reporterName.trim() || "Anonymous Citizen",
        reporter_email: reporterEmail.trim(),
        location: {
          type: "Point" as const,
          coordinates: [location.lng, location.lat] as [number, number], // GeoJSON [longitude, latitude]
        },
      };

      const response = await createRequest(payload);
      setSuccessResponse(response);
    } catch (err: unknown) {
      console.error("Emergency report submission error:", err);
      const message = err instanceof Error ? err.message : "Failed to submit emergency report. Please try again.";
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setDescription("");
    setReporterName("");
    setReporterEmail("");
    setLocation(null);
    setSuccessResponse(null);
    setApiError(null);
    setFormErrors({});
  };

  // Helper badge styles for severity
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-600 text-white border-red-400 font-bold uppercase tracking-wider animate-pulse";
      case "high":
        return "bg-orange-600 text-white border-orange-400 font-bold uppercase tracking-wider";
      case "medium":
        return "bg-amber-600 text-white border-amber-400 font-semibold uppercase tracking-wider";
      case "low":
        return "bg-emerald-600 text-white border-emerald-400 font-semibold uppercase tracking-wider";
      default:
        return "bg-slate-700 text-slate-200 border-slate-500 font-semibold uppercase tracking-wider";
    }
  };

  // Success Screen View
  if (successResponse) {
    return (
      <div className="bg-slate-900 border-2 border-emerald-500 rounded-xl p-6 shadow-2xl text-slate-100 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center shrink-0">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Emergency Report Logged</h2>
            <p className="text-xs text-emerald-400 font-medium">First responders have been notified via SwarmRescue AI</p>
          </div>
        </div>

        {/* Request Identifier */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Report Confirmation ID</span>
          <div className="text-lg font-mono font-bold text-emerald-400 select-all tracking-wide break-all">
            {successResponse.id}
          </div>
        </div>

        {/* AI Auto-Classified Details */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
            Swarm AI Auto-Classification
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Severity Level</span>
              <span className={`inline-block px-3 py-1 text-xs rounded border ${getSeverityBadgeClass(successResponse.severity)}`}>
                {successResponse.severity}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Incident Category</span>
              <span className="inline-block px-3 py-1 text-xs font-bold text-white bg-slate-800 border border-slate-600 rounded uppercase tracking-wider">
                {successResponse.category}
              </span>
            </div>
          </div>

          {successResponse.reasoning && (
            <div className="pt-2 border-t border-slate-900">
              <span className="text-[11px] text-slate-400 block mb-0.5">AI Analysis Reasoning</span>
              <p className="text-xs text-slate-300 italic bg-slate-900/90 p-2.5 rounded border border-slate-800">
                "{successResponse.reasoning}"
              </p>
            </div>
          )}
        </div>

        {/* Summary info */}
        <div className="text-xs text-slate-400 space-y-1">
          <p><strong className="text-slate-300">Reporter:</strong> {successResponse.reporter_name} ({successResponse.reporter_email})</p>
          <p><strong className="text-slate-300">Coordinates:</strong> {successResponse.location.coordinates[1].toFixed(5)}, {successResponse.location.coordinates[0].toFixed(5)}</p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-slate-600 transition text-sm flex items-center justify-center gap-2 shadow-lg"
        >
          Submit Another Emergency Report
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* API Error Alert */}
      {apiError && (
        <div className="p-4 bg-red-950/80 border-2 border-red-600 rounded-lg text-red-200 text-sm flex items-start gap-3 shadow-lg">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h4 className="font-bold text-red-100">Submission Error</h4>
            <p className="text-xs text-red-300 mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* Description Field */}
      <div>
        <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
          Emergency Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide urgent details (e.g. 'Flash flood trapping 3 people on roof near main market...')"
          rows={4}
          disabled={isSubmitting}
          className={`w-full p-3.5 bg-slate-950 border ${
            formErrors.description ? "border-red-500 focus:ring-red-500" : "border-slate-700 focus:ring-red-500"
          } rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 transition shadow-inner disabled:opacity-50`}
        />
        {formErrors.description ? (
          <p className="mt-1 text-xs text-red-400 font-semibold">{formErrors.description}</p>
        ) : (
          <p className="mt-1 text-[11px] text-slate-400">Describe what happened, hazards present, or victims involved.</p>
        )}
      </div>

      {/* Location Picker */}
      <div>
        <LocationPicker onLocationSelect={handleLocationSelect} />
        {formErrors.location && (
          <p className="mt-1.5 text-xs text-red-400 font-semibold">{formErrors.location}</p>
        )}
      </div>

      {/* Reporter Email Field */}
      <div>
        <label htmlFor="reporter_email" className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
          Reporter Email Address <span className="text-red-500">*</span>
        </label>
        <input
          id="reporter_email"
          name="reporter_email"
          type="email"
          value={reporterEmail}
          onChange={(e) => setReporterEmail(e.target.value)}
          placeholder="your.email@example.com"
          disabled={isSubmitting}
          className={`w-full p-3.5 bg-slate-950 border ${
            formErrors.reporter_email ? "border-red-500 focus:ring-red-500" : "border-slate-700 focus:ring-red-500"
          } rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 transition shadow-inner disabled:opacity-50`}
        />
        {formErrors.reporter_email ? (
          <p className="mt-1 text-xs text-red-400 font-semibold">{formErrors.reporter_email}</p>
        ) : (
          <p className="mt-1 text-[11px] text-slate-400">Required for receiving real-time status notifications.</p>
        )}
      </div>

      {/* Reporter Name Field */}
      <div>
        <label htmlFor="reporter_name" className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
          Reporter Name <span className="text-slate-500 font-normal text-[11px] uppercase">(Optional)</span>
        </label>
        <input
          id="reporter_name"
          name="reporter_name"
          type="text"
          value={reporterName}
          onChange={(e) => setReporterName(e.target.value)}
          placeholder="Jane Doe"
          disabled={isSubmitting}
          className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition shadow-inner disabled:opacity-50"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 px-6 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-extrabold text-base rounded-lg transition-all shadow-xl shadow-red-950/50 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Submitting & Classifying Emergency...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Transmit Emergency Report</span>
          </>
        )}
      </button>
    </form>
  );
}
