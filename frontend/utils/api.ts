export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${BACKEND_URL}${path}`;
  
  const defaultOptions: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, defaultOptions);
  
  let data = null;
  try {
    data = await response.json();
  } catch (e) {
  
  }

  if (!response.ok) {
    throw new Error(data?.message || `API error: ${response.status}`);
  }

  return data;
}
