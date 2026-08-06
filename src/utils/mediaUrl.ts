import Constants from "expo-constants";

const API_URL =
    (Constants.expoConfig?.extra as any)?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.API_URL ||
    "http://localhost:8000";

/** Paths relativos (`/media/...`) precisam do host da API; URLs absolutas passam direto. */
export function resolveMediaUrl(url?: string | null): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
        return trimmed;
    }
    const base = API_URL.replace(/\/+$/, "");
    const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return `${base}${path}`;
}
