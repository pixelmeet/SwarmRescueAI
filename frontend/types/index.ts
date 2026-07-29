export type SeverityLevel = "low" | "medium" | "high" | "critical";

export type RequestStatus = "pending" | "classified" | "dispatched" | "resolved" | "cancelled";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface EmergencyRequest {
  id: string;
  description: string;
  location: Coordinates;
  severity: SeverityLevel;
  status: RequestStatus;
  createdAt: string;
}

export interface RescueTeam {
  id: string;
  name: string;
  location: Coordinates;
  available: boolean;
}
