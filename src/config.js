// Everything environment-specific lives here.
//
// By default the app calls a same-origin "/api/v1" path. The Vite dev server
// and the Docker/nginx image both proxy "/api" to the backend (see
// vite.config.js and docker/nginx.conf.template), so no CORS setup is needed.
//
// To call a backend directly instead, either:
//   - set VITE_API_BASE_URL at build time (e.g. https://host/api/v1), or
//   - type a URL into "Backend API URL" on the login screen (saved per browser).
//   Direct calls are cross-origin, so the backend's CORS_ORIGIN must allow them.

const API_BASE_KEY = "curaflow_api_base";

export const DEFAULT_API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/+$/, "");

export function getApiBase() {
  return localStorage.getItem(API_BASE_KEY) || DEFAULT_API_BASE;
}

/** Saves an override. An empty value (or the default itself) clears it. */
export function setApiBase(url) {
  const clean = url.trim().replace(/\/+$/, "");
  if (!clean || clean === DEFAULT_API_BASE) localStorage.removeItem(API_BASE_KEY);
  else localStorage.setItem(API_BASE_KEY, clean);
}

export const STORAGE_KEYS = {
  access: "curaflow_access_token",
  refresh: "curaflow_refresh_token",
  user: "curaflow_user",
};
