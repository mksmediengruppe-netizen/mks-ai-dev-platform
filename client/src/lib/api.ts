/* ============================================================
   Centralized API configuration
   All pages should import API_BASE from here instead of
   hardcoding URLs.
   ============================================================ */

export const API_BASE = import.meta.env.VITE_API_URL || "https://api.mksitdev.ru";

/**
 * Authenticated fetch wrapper.
 * Automatically attaches JWT token from localStorage.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const stored = localStorage.getItem("platform_user");
  let token = "";
  if (stored) {
    try {
      token = JSON.parse(stored).token || "";
    } catch {
      // ignore parse errors
    }
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Only set Content-Type for non-FormData bodies
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
}
