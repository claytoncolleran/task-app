import type { AuthSessionResponse, FetchLinkTitleResponse, SyncPullResponse } from "@task-app/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const TOKEN_KEY = "task-app:session";

export function getSessionToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSessionToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSessionToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getSessionToken();
  const headers = new Headers(init?.headers ?? {});
  headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 401) {
    clearSessionToken();
    throw new Error("unauthorized");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`request failed: ${res.status} ${body}`);
  }
  return (await res.json()) as T;
}

export const api = {
  requestMagicLink(email: string): Promise<{ ok: true }> {
    return request("/auth/request", { method: "POST", body: JSON.stringify({ email }) });
  },
  verifyMagicCode(email: string, code: string): Promise<AuthSessionResponse> {
    return request("/auth/verify", { method: "POST", body: JSON.stringify({ email, code }) });
  },
  pullSync(since: string | null): Promise<SyncPullResponse> {
    const q = since ? `?since=${encodeURIComponent(since)}` : "";
    return request(`/sync/pull${q}`);
  },
  pushSync(payload: { tasks: unknown[]; groups: unknown[] }): Promise<{ ok: true; serverTime: string }> {
    return request("/sync/push", { method: "POST", body: JSON.stringify(payload) });
  },
  fetchLinkTitle(url: string): Promise<FetchLinkTitleResponse> {
    return request("/link/title", { method: "POST", body: JSON.stringify({ url }) });
  },
};

export const apiUrl = API_URL;
