// Typed fetch wrapper to the Go API. Every API call goes through here — never
// raw fetch in components (CLAUDE.md §8).
import type { HealthResponse } from '@/types/api';
import type {
  AuthResult,
  Case,
  CaseFile,
  CaseReturn,
  CreateCaseInput,
  Lab,
  Message,
  Notification,
  ReceptionChecklist,
  Role,
  StatusEvent,
  Tokens,
  User
} from '@/types/case';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';

// The origin (without the /api/v1 suffix) is used to resolve relative file URLs
// such as "/uploads/...".
export const API_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, '');

/** Error thrown for non-2xx responses, carrying the API error envelope code. */
export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

// --- in-memory token + persistence -----------------------------------------
const ACCESS_KEY = 'df_access';
const REFRESH_KEY = 'df_refresh';

let accessToken: string | null = null;

export function setTokens(tokens: Tokens | null) {
  accessToken = tokens?.access_token ?? null;
  if (typeof window === 'undefined') return;
  if (tokens) {
    localStorage.setItem(ACCESS_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  } else {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}

export function hydrateTokens() {
  if (typeof window === 'undefined') return;
  accessToken = localStorage.getItem(ACCESS_KEY);
}

function refreshTokenValue(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

// --- core request -----------------------------------------------------------
interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  retry?: boolean; // internal: prevents infinite refresh loops
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, retry = true } = opts;

  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  if (auth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });

  // Transparent one-shot refresh on expired access token.
  if (res.status === 401 && auth && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, { ...opts, retry: false });
    }
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = json?.error as { code?: string; message?: string } | undefined;
    throw new ApiClientError(
      err?.code ?? 'unknown',
      err?.message ?? res.statusText,
      res.status
    );
  }

  return json as T;
}

async function tryRefresh(): Promise<boolean> {
  const token = refreshTokenValue();
  if (!token) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: token })
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { data: Tokens };
    setTokens(json.data);
    return true;
  } catch {
    return false;
  }
}

// Unwrap the standard { data } envelope.
async function data<T>(path: string, opts?: RequestOptions): Promise<T> {
  const res = await request<{ data: T }>(path, opts);
  return res.data;
}

// --- public API surface -----------------------------------------------------
export const api = {
  health: () => request<HealthResponse>('/health', { auth: false }),

  auth: {
    register: (input: RegisterInput) =>
      data<AuthResult>('/auth/register', { method: 'POST', body: input, auth: false }),
    login: (email: string, password: string) =>
      data<AuthResult>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
    me: () => data<User>('/auth/me'),
    labs: () => data<Lab[]>('/labs')
  },

  cases: {
    list: (params?: CaseListParams) =>
      data<Case[]>(`/cases${toQuery(params)}`),
    get: (id: string) => data<Case>(`/cases/${id}`),
    create: (input: CreateCaseInput) =>
      data<Case>('/cases', { method: 'POST', body: input }),
    remove: (id: string) =>
      request<null>(`/cases/${id}`, { method: 'DELETE' }),
    updateStatus: (id: string, status: string, note?: string) =>
      data<Case>(`/cases/${id}/status`, { method: 'PATCH', body: { status, note } }),
    history: (id: string) => data<StatusEvent[]>(`/cases/${id}/history`),
    returns: (id: string) => data<CaseReturn[]>(`/cases/${id}/returns`),
    returnCase: (id: string, reasons: string[], note?: string) =>
      data<Case>(`/cases/${id}/return`, { method: 'POST', body: { reasons, note } }),
    reception: (id: string, checklist: ReceptionChecklist) =>
      data<Case>(`/cases/${id}/reception`, { method: 'PATCH', body: { checklist } }),
    sign: (id: string, signature: string) =>
      data<Case>(`/cases/${id}/sign`, { method: 'POST', body: { signature } }),
    patientHistory: (patientRef: string) =>
      data<Case[]>(`/cases?patient_ref=${encodeURIComponent(patientRef)}`)
  },

  notifications: {
    list: () => data<Notification[]>('/notifications'),
    unreadCount: () => data<{ unread: number }>('/notifications/unread-count'),
    markRead: (id: string) =>
      request<null>(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => request<null>('/notifications/read-all', { method: 'POST' })
  },

  messages: {
    list: (caseId: string) => data<Message[]>(`/cases/${caseId}/messages`),
    create: (caseId: string, content: string) =>
      data<Message>(`/cases/${caseId}/messages`, { method: 'POST', body: { content } })
  },

  files: {
    list: (caseId: string) => data<CaseFile[]>(`/cases/${caseId}/files`),
    remove: (caseId: string, fileId: string) =>
      request<null>(`/cases/${caseId}/files/${fileId}`, { method: 'DELETE' }),
    // Multipart upload is handled specially (no JSON Content-Type).
    upload: async (caseId: string, file: File, fileType: string): Promise<CaseFile> => {
      const form = new FormData();
      form.append('file', file);
      form.append('file_type', fileType);
      const headers: Record<string, string> = {};
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
      const res = await fetch(`${BASE_URL}/cases/${caseId}/files`, {
        method: 'POST',
        headers,
        body: form
      });
      const json = res.status === 204 ? null : await res.json();
      if (!res.ok) {
        const err = json?.error as { code?: string; message?: string } | undefined;
        throw new ApiClientError(err?.code ?? 'unknown', err?.message ?? res.statusText, res.status);
      }
      return json.data as CaseFile;
    }
  }
};

// --- helpers ----------------------------------------------------------------
export interface RegisterInput {
  email: string;
  password: string;
  role: Role;
  full_name: string;
  clinic_name: string;
  phone?: string;
  city?: string;
}

export interface CaseListParams {
  status?: string;
  priority?: string;
  due_before?: string;
}

function toQuery(params?: CaseListParams): string {
  if (!params) return '';
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.priority) q.set('priority', params.priority);
  if (params.due_before) q.set('due_before', params.due_before);
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** Resolve a possibly-relative file URL (e.g. /uploads/..) to an absolute one. */
export function fileUrl(url: string): string {
  return url.startsWith('http') ? url : `${API_ORIGIN}${url}`;
}
