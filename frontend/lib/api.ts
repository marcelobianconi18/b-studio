const FALLBACK_API_BASE_URL = "http://localhost:8001";

export const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_BASE_URL || FALLBACK_API_BASE_URL
).replace(/\/$/, "");

export function apiUrl(path: string): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
}
