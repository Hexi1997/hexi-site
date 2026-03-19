const LOCAL_AUTH_API_URL = "http://localhost:8787";

export function getAuthApiUrl() {
  return process.env.NEXT_PUBLIC_AUTH_API_URL ??
    (process.env.NODE_ENV === "development" ? LOCAL_AUTH_API_URL : "");
}
