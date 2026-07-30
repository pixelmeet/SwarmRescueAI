"use client";

import React, { useState } from "react";
import { LocationPicker } from "../map/LocationPicker";
import { createRequest, EmergencyRequestResponse, fetchApi, Severity, Category } from "@/lib/api";
import { validateEmergencyReport } from "@/lib/validators";
import {
  SeverityBadge,
  CategoryBadge,
  RequestStatusBadge,
} from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  MapPin,
  FileText,
  Mail,
  User,
  Send,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface ClassifyPreview {
  severity: Severity;
  category: Category;
  required_skills: string[];
  reasoning: string;
}

export function EmergencyReportForm() {
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [successResponse, setSuccessResponse] =
    useState<EmergencyRequestResponse | null>(null);

  // Live AI Classification Preview state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ClassifyPreview | null>(null);

  const handleLocationSelect = (loc: { lat: number; lng: number }) => {
    setLocation(loc);
    if (formErrors.location) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated.location;
        return updated;
      });
    }
  };

  // Trigger live AI triage preview
  const handleTestClassify = async () => {
    if (!description.trim() || description.trim().length < 10) return;
    setPreviewLoading(true);
    try {
      const res = await fetchApi<ClassifyPreview>("/api/requests/classify-test", {
        method: "POST",
        body: JSON.stringify({ description: description.trim() }),
      });
      setPreviewData(res);
    } catch (err) {
      console.warn("Classify test error:", err);
    } finally {
      setPreviewLoading(false);
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

      const payload = {
        description: description.trim(),
        reporter_name: reporterName.trim() || "Anonymous Citizen",
        reporter_email: reporterEmail.trim(),
        location: {
          type: "Point" as const,
          coordinates: [location.lng, location.lat] as [number, number],
        },
      };

      const response = await createRequest(payload);
      setSuccessResponse(response);
    } catch (err: unknown) {
      console.error("Emergency report submission error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to submit emergency report. Please try again.";
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
    setPreviewData(null);
  };

  // Success Screen View
  if (successResponse) {
    return (
      <div className="bg-surface-primary border-2 border-emerald-500 rounded-card p-6 md:p-8 shadow-2xl text-slate-100 space-y-6 animate-fade-in">
        <div className="flex items-center gap-3 border-b border-[var(--border-primary)] pb-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Emergency Report Transmitted
            </h2>
            <p className="text-xs text-emerald-400 font-medium">
              First responders notified via SwarmRescue AI real-time socket
            </p>
          </div>
        </div>

        {/* Request Identifier */}
        <div className="bg-slate-950 p-4 rounded-card border border-[var(--border-primary)] space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Report Confirmation ID
          </span>
          <div className="text-lg font-mono font-extrabold text-emerald-400 select-all tracking-wide break-all">
            {successResponse.id}
          </div>
        </div>

        {/* AI Auto-Classified Details */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-card border border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            Groq Llama-3.3 AI Triage Classification
          </h3>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Severity Level</span>
              <SeverityBadge severity={successResponse.severity} pulse={true} size="sm" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Incident Category</span>
              <CategoryBadge category={successResponse.category} size="sm" />
            </div>
          </div>

          {successResponse.reasoning && (
            <div className="pt-2.5 border-t border-slate-900">
              <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                AI Diagnostic Reasoning
              </span>
              <p className="text-xs text-slate-300 italic bg-slate-900 p-3 rounded-card border border-slate-800 leading-relaxed">
                "{successResponse.reasoning}"
              </p>
            </div>
          )}
        </div>

        {/* Summary info */}
        <div className="text-xs text-slate-400 space-y-1 font-mono bg-slate-950/40 p-3 rounded-card border border-slate-900">
          <p>
            <strong className="text-slate-300">Reporter:</strong> {successResponse.reporter_name} ({successResponse.reporter_email})
          </p>
          <p>
            <strong className="text-slate-300">Coordinates:</strong> [{successResponse.location.coordinates[1].toFixed(5)}, {successResponse.location.coordinates[0].toFixed(5)}]
          </p>
        </div>

        <Button
          variant="secondary"
          size="lg"
          onClick={handleReset}
          className="w-full"
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Submit Another Emergency Report
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* API Error Alert */}
      {apiError && (
        <div className="p-4 bg-red-950/80 border-2 border-red-600 rounded-card text-red-200 text-sm flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-red-100">Submission Error</h4>
            <p className="text-xs text-red-300 mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* Form Step Indicators */}
      <div className="grid grid-cols-3 gap-2 pb-2 text-[11px] font-bold border-b border-slate-800">
        <div className="flex items-center gap-1.5 text-primary">
          <span className="w-5 h-5 rounded-full bg-primary-muted border border-blue-600 flex items-center justify-center text-[10px]">
            1
          </span>
          <span>Describe</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px]">
            2
          </span>
          <span>Location</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px]">
            3
          </span>
          <span>Contact</span>
        </div>
      </div>

      {/* Description Field with Live AI Preview */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label
            htmlFor="description"
            className="block text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-red-400" />
            Emergency Description <span className="text-red-500">*</span>
          </label>
          <span className="text-[11px] font-mono text-slate-500">
            {description.length} / 500 chars
          </span>
        </div>

        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => {
            if (e.target.value.length <= 500) {
              setDescription(e.target.value);
            }
          }}
          onBlur={handleTestClassify}
          placeholder="Provide urgent details (e.g. 'Flash flood trapping 3 people on roof near main market...')"
          rows={4}
          disabled={isSubmitting}
          error={formErrors.description}
        />

        {/* Live AI Classification Preview Pill */}
        <div className="mt-2 flex items-center justify-between min-h-[28px]">
          {previewLoading ? (
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" />
              Running Groq AI Triage Preview...
            </span>
          ) : previewData ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">
                AI Preview:
              </span>
              <SeverityBadge severity={previewData.severity} size="xs" />
              <CategoryBadge category={previewData.category} size="xs" />
            </div>
          ) : (
            <span className="text-[11px] text-slate-500">
              Tip: AI auto-classifies severity on description blur.
            </span>
          )}

          {description.length >= 10 && !previewData && !previewLoading && (
            <button
              type="button"
              onClick={handleTestClassify}
              className="text-[11px] text-primary hover:text-primary-hover font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" /> Preview AI Triage
            </button>
          )}
        </div>
      </div>

      {/* Location Picker */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
          <MapPin className="w-3.5 h-3.5 text-red-400" />
          Incident Location <span className="text-red-500">*</span>
        </div>
        <LocationPicker onLocationSelect={handleLocationSelect} />
        {formErrors.location && (
          <p className="mt-1.5 text-xs text-error font-semibold">
            {formErrors.location}
          </p>
        )}
      </div>

      {/* Reporter Email Field */}
      <div>
        <Input
          label="Reporter Email Address *"
          id="reporter_email"
          name="reporter_email"
          type="email"
          value={reporterEmail}
          onChange={(e) => setReporterEmail(e.target.value)}
          placeholder="your.email@example.com"
          disabled={isSubmitting}
          error={formErrors.reporter_email}
        />
      </div>

      {/* Reporter Name Field */}
      <div>
        <Input
          label="Reporter Name (Optional)"
          id="reporter_name"
          name="reporter_name"
          type="text"
          value={reporterName}
          onChange={(e) => setReporterName(e.target.value)}
          placeholder="Jane Doe"
          disabled={isSubmitting}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="danger"
        size="lg"
        loading={isSubmitting}
        className="w-full uppercase tracking-wider py-4 font-black text-base shadow-xl"
        icon={<Send className="w-5 h-5" />}
      >
        Transmit Emergency Report
      </Button>
    </form>
  );
}
