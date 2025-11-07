export async function api(path: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  // Only add Content-Type if not FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error: ${res.status}`);
  }

  return res.json();
}
