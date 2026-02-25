const FALLBACK_API_BASE_URL = "http://localhost:8001";

const configuredApiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    FALLBACK_API_BASE_URL;

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, "");

export function apiUrl(path: string): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
}
