export interface EmergencyReportInput {
  description: string;
  reporter_email: string;
  reporter_name?: string;
  location?: { lat: number; lng: number } | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateEmergencyReport(data: EmergencyReportInput): ValidationResult {
  const errors: Record<string, string> = {};

  // Description validation
  if (!data.description || data.description.trim().length === 0) {
    errors.description = "Emergency description is required.";
  } else if (data.description.trim().length < 10) {
    errors.description = "Please provide more details (at least 10 characters).";
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.reporter_email || data.reporter_email.trim().length === 0) {
    errors.reporter_email = "Email address is required for status updates.";
  } else if (!emailRegex.test(data.reporter_email.trim())) {
    errors.reporter_email = "Please enter a valid email address.";
  }

  // Location validation
  if (!data.location || typeof data.location.lat !== "number" || typeof data.location.lng !== "number") {
    errors.location = "Please select or verify an emergency location on the map.";
  } else if (
    data.location.lat < -90 ||
    data.location.lat > 90 ||
    data.location.lng < -180 ||
    data.location.lng > 180
  ) {
    errors.location = "Invalid map coordinates.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
