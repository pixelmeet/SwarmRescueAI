const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Severity = "low" | "medium" | "high" | "critical";
export type Category = "fire" | "medical" | "trapped" | "flood" | "other";
export type RequestStatus = "pending" | "assigned" | "en_route" | "resolved";

export type ResourceType = "rescue_team" | "ambulance" | "hospital" | "volunteer";
export type AssignmentStatus = "assigned" | "en_route" | "completed" | "cancelled";
export type ResourceStatus = "available" | "busy" | "offline";
export type TeamType = "fire" | "police" | "medical" | "general";

export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface EmergencyRequestCreate {
  description: string;
  location: GeoJSONPoint;
  reporter_email: string;
  reporter_name: string;
  severity?: Severity;
  category?: Category;
  status?: RequestStatus;
  required_skills?: string[];
  reasoning?: string;
}

export interface EmergencyRequestResponse {
  id: string;
  description: string;
  location: GeoJSONPoint;
  severity: Severity;
  category: Category;
  status: RequestStatus;
  reporter_email: string;
  reporter_name: string;
  required_skills: string[];
  reasoning?: string;
  created_at: string;
}

export interface RecommendationCandidate {
  resource_id: string;
  name: string;
  distance_km: number;
  score: number;
  eta_minutes: number | null;
  route_geometry?: {
    type: "LineString";
    coordinates: [number, number][];
  } | null;
}

export interface RequestRecommendations {
  rescue_teams: RecommendationCandidate[];
  ambulances: RecommendationCandidate[];
  hospitals: RecommendationCandidate[];
  volunteers: RecommendationCandidate[];
}

export interface AssignmentCreate {
  request_id: string;
  resource_type: ResourceType;
  resource_id: string;
  eta_minutes?: number;
  status?: AssignmentStatus;
}

export interface AssignmentResponse {
  id: string;
  request_id: string;
  resource_type: ResourceType;
  resource_id: string;
  eta_minutes?: number;
  status: AssignmentStatus;
  assigned_at: string;
}

export interface RescueTeam {
  id: string;
  name: string;
  type: TeamType;
  location: GeoJSONPoint;
  status: ResourceStatus;
  skills: string[];
}

export interface Ambulance {
  id: string;
  driver_name: string;
  location: GeoJSONPoint;
  status: ResourceStatus;
  plate_number: string;
}

export interface Hospital {
  id: string;
  name: string;
  location: GeoJSONPoint;
  total_beds: number;
  available_beds: number;
  phone: string;
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  location: GeoJSONPoint;
  skills: string[];
  status: ResourceStatus;
}

export interface AnalyticsData {
  total_requests: number;
  resolved_requests: number;
  avg_time_creation_to_assignment: number;
  avg_time_assignment_to_resolution: number;
  request_count_by_category: Record<Category | string, number>;
  request_count_by_severity: Record<Severity | string, number>;
  resource_utilization_pct: number;
  active_resources_count: number;
}

// Note: In production applications, JWT should be stored in httpOnly, SameSite=Strict cookies to mitigate XSS vulnerabilities.
// For demo/student project scope, localStorage is used here.
export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function setAdminToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("admin_token", token);
  }
}

export function removeAdminToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("admin_token");
  }
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const token = getAdminToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMessage = `API Error: ${res.status} ${res.statusText}`;
    try {
      const errorData = await res.json();
      if (errorData.detail) {
        if (typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join(", ");
        }
      }
    } catch {
      // Ignore json parse error
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

/* ==================== AUTHENTICATION ==================== */

export async function loginAdmin(credentials: { username: string; password: string }): Promise<{ access_token: string; token_type: string }> {
  const res = await fetchApi<{ access_token: string; token_type: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  if (res.access_token) {
    setAdminToken(res.access_token);
  }
  return res;
}

/* ==================== EMERGENCY REQUESTS ==================== */

export async function createRequest(data: EmergencyRequestCreate): Promise<EmergencyRequestResponse> {
  return fetchApi<EmergencyRequestResponse>("/api/requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getRequest(id: string): Promise<EmergencyRequestResponse> {
  return fetchApi<EmergencyRequestResponse>(`/api/requests/${id}`);
}

export async function listRequests(filters?: {
  status?: RequestStatus;
  severity?: Severity;
  category?: Category;
}): Promise<EmergencyRequestResponse[]> {
  const query = new URLSearchParams();
  if (filters?.status) query.append("status", filters.status);
  if (filters?.severity) query.append("severity", filters.severity);
  if (filters?.category) query.append("category", filters.category);

  const queryString = query.toString();
  return fetchApi<EmergencyRequestResponse[]>(`/api/requests${queryString ? `?${queryString}` : ""}`);
}

export async function getRequestRecommendations(id: string): Promise<RequestRecommendations> {
  return fetchApi<RequestRecommendations>(`/api/requests/${id}/recommendations`);
}

/* ==================== ASSIGNMENTS ==================== */

export async function listAssignments(resourceId?: string, status?: AssignmentStatus): Promise<AssignmentResponse[]> {
  const query = new URLSearchParams();
  if (resourceId) query.append("resource_id", resourceId);
  if (status) query.append("status", status);

  const queryString = query.toString();
  return fetchApi<AssignmentResponse[]>(`/api/assignments${queryString ? `?${queryString}` : ""}`);
}

export async function createAssignment(data: AssignmentCreate): Promise<AssignmentResponse> {
  return fetchApi<AssignmentResponse>("/api/assignments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAssignmentStatus(id: string, status: AssignmentStatus): Promise<AssignmentResponse> {
  return fetchApi<AssignmentResponse>(`/api/assignments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function autoAssign(): Promise<{ message: string; assignments: AssignmentResponse[] }> {
  return fetchApi<{ message: string; assignments: AssignmentResponse[] }>("/api/assignments/auto-assign", {
    method: "POST",
  });
}

export async function manualOverrideAssignment(data: AssignmentCreate): Promise<{ message: string; assignment: AssignmentCreate }> {
  return fetchApi<{ message: string; assignment: AssignmentCreate }>("/api/assignments/manual-override", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* ==================== RESOURCES ==================== */

export async function listTeams(status?: ResourceStatus): Promise<RescueTeam[]> {
  const query = status ? `?status=${status}` : "";
  return fetchApi<RescueTeam[]>(`/api/teams${query}`);
}

export async function listAmbulances(status?: ResourceStatus): Promise<Ambulance[]> {
  const query = status ? `?status=${status}` : "";
  return fetchApi<Ambulance[]>(`/api/ambulances${query}`);
}

export async function listHospitals(): Promise<Hospital[]> {
  return fetchApi<Hospital[]>("/api/hospitals");
}

export async function listVolunteers(status?: ResourceStatus): Promise<Volunteer[]> {
  const query = status ? `?status=${status}` : "";
  return fetchApi<Volunteer[]>(`/api/volunteers${query}`);
}

/* ==================== ANALYTICS ==================== */

export async function getAnalytics(): Promise<AnalyticsData> {
  return fetchApi<AnalyticsData>("/api/analytics");
}

/* ==================== CLASSIFICATION TEST ==================== */

export async function classifyTest(description: string): Promise<{
  severity: Severity;
  category: Category;
  required_skills: string[];
  reasoning: string;
}> {
  return fetchApi("/api/classify-test", {
    method: "POST",
    body: JSON.stringify({ description }),
  });
}
