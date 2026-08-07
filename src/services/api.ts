export const getBackendOrigin = (): string => {
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
  return apiBase.replace(/\/api\/?$/, "");
};

export const getFormattedLogoUrl = (url?: string): string => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;

  const backendOrigin = getBackendOrigin();

  // If path is relative like "/uploads/..."
  if (url.startsWith("/")) {
    return `${backendOrigin}${url}`;
  }

  // If URL has hardcoded localhost:5001/5000 in DB but VITE_API_URL points elsewhere (e.g. deployed on Vercel/Render)
  if (url.includes("localhost:") && !backendOrigin.includes("localhost:")) {
    const uploadIndex = url.indexOf("/uploads");
    if (uploadIndex !== -1) {
      return `${backendOrigin}${url.substring(uploadIndex)}`;
    }
  }

  return url;
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("knit-auth-token");
  
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

export const apiDownload = async (endpoint: string, filename: string) => {
  const token = localStorage.getItem("knit-auth-token");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
  if (!response.ok) throw new Error("Download failed");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export default apiFetch;
