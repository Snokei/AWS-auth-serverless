// Frontend Configuration & Backend API Endpoint Helper

export const API_BASE_URL =
  import.meta.env.VITE_API_ENDPOINT ||
  import.meta.env.VITE_API_URL ||
  "https://rdw63qafseuxth2p2wfxklnkna0eiwdo.lambda-url.us-east-1.on.aws";

/**
 * Resolves the full URL for a given API path using VITE_API_ENDPOINT or VITE_API_URL
 * @param path API path e.g. '/login', '/register', or '/api/login'
 */
export const getApiUrl = (path: string): string => {
  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");

  if (baseUrl.endsWith("/api") && cleanPath.startsWith("api/")) {
    return `${baseUrl}/${cleanPath.slice(4)}`;
  }
  if (!baseUrl.endsWith("/api") && !cleanPath.startsWith("api/")) {
    return `${baseUrl}/api/${cleanPath}`;
  }
  return `${baseUrl}/${cleanPath}`;
};
