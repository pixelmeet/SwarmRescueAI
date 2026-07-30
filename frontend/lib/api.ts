const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Severity = "low" | "medium" | "high" | "critical";
export type Category = "fire" | "medical" | "trapped" | "flood" | "other";
export type RequestStatus = "pending" | "assigned" | "en_route" | "resolved";

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

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
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
      // JSON parse failed, use status string
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

/**
 * Creates a new emergency request.
 */
export async function createRequest(data: EmergencyRequestCreate): Promise<EmergencyRequestResponse> {
  return fetchApi<EmergencyRequestResponse>("/api/requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Fetches a single emergency request by ID.
 */
export async function getRequest(id: string): Promise<EmergencyRequestResponse> {
  return fetchApi<EmergencyRequestResponse>(`/api/requests/${id}`);
}

/**
 * Lists emergency requests with optional filters.
 */
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
  const endpoint = `/api/requests${queryString ? `?${queryString}` : ""}`;
  return fetchApi<EmergencyRequestResponse[]>(endpoint);
}
