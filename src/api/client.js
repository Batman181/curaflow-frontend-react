import { getApiBase } from "../config.js";
import { getAccessToken, getRefreshToken, setSession, clearSession } from "./session.js";

// The backend accepts auth either as an httpOnly cookie or as a Bearer header.
// This client always uses the Bearer header: the login response returns the
// tokens in its JSON body precisely so a separate frontend can do that.

export const SESSION_EXPIRED_EVENT = "curaflow:session-expired";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new ApiError("No refresh token available", 401);

  const res = await fetch(`${getApiBase()}/users/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(json?.message || "Session expired", res.status);

  setSession({ accessToken: json.data.accessToken, refreshToken: json.data.refreshToken });
  return json.data.accessToken;
}

function statusMessage(status) {
  if (status === 502 || status === 503 || status === 504) {
    return "The backend didn't respond — it may still be waking up. Give it a few seconds and try again.";
  }
  return `Request failed (${status})`;
}

/**
 * apiRequest("/patients", { method: "POST", body: {...} })
 *  - body is JSON-stringified unless isForm is true (pass a FormData for uploads)
 *  - resolves with the unwrapped `data` field of the backend's ApiResponse
 *  - on a 401, silently refreshes the token once and retries (unless retry: false)
 */
export async function apiRequest(path, options = {}) {
  const { method = "GET", body = null, isForm = false, retry = true } = options;

  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${getApiBase()}${path}`, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the backend. Check the API URL and that the server is running.", 0);
  }

  const json = await res.json().catch(() => null);

  if (res.status === 401 && retry && getRefreshToken()) {
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;
      return apiRequest(path, { ...options, retry: false });
    } catch {
      clearSession();
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
      throw new ApiError("Your session expired. Please log in again.", 401);
    }
  }

  if (!res.ok) throw new ApiError(json?.message || statusMessage(res.status), res.status);

  return json ? json.data : null;
}
