export function validateEmergencyReport(data: { description: string; phone?: string }) {
  const errors: Record<string, string> = {};
  if (!data.description || data.description.trim().length < 5) {
    errors.description = "Description must be at least 5 characters.";
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
