const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5000";

export class ApiError extends Error {
  status: number;
  bodyText?: string;

  constructor(message: string, status: number, bodyText?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.bodyText = bodyText;
  }
}

function normalizeToken(raw: string | null): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  return t.toLowerCase().startsWith("bearer ") ? t.slice(7).trim() : t;
}

export function getToken(): string | null {
  const raw = localStorage.getItem("token") ?? localStorage.getItem("jwt");
  return normalizeToken(raw);
}

export function setToken(token: string) {
  const t = normalizeToken(token);
  if (t) localStorage.setItem("token", t);
}

export function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("jwt");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readBodyTextSafe(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    const body = await readBodyTextSafe(res);
    throw new ApiError(`GET ${path} failed`, res.status, body);
  }

  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await readBodyTextSafe(res);
    throw new ApiError(`POST ${path} failed`, res.status, text);
  }

  return (await res.json()) as T;
}
