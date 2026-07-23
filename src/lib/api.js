import { supabase } from "./supabaseClient.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

if (!import.meta.env.VITE_API_URL) {
  console.warn(
    "[LedgerOS] VITE_API_URL not set — defaulting to http://localhost:4000. Set this in .env once the backend is deployed."
  );
}

async function request(path, { method = "GET", body } = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.error || `Request to ${path} failed (${res.status})`);
  }

  return json;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
};
