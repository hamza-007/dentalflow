// Shared API response shapes (CLAUDE.md §7).

export interface ApiError {
  code: string;
  message: string;
}

// Standard success envelope: { "data": <payload> } or { "data", "meta": { total } }.
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
  };
}

// GET /health returns this object directly (not wrapped in `data`).
export interface HealthResponse {
  status: string;
  db: string;
}
