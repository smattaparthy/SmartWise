export async function api(path: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Only add Content-Type if not FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Exclude headers from options spread to prevent overwriting our headers
  const { headers: _ignored, ...restOptions } = options;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...restOptions,
    headers,
  });

  if (!res.ok) {
    // Handle authentication errors - redirect to login
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }

    const text = await res.text();
    throw new Error(text || `API error: ${res.status}`);
  }

  return res.json();
}
