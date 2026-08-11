import Constants from "expo-constants";
import { resolveApiUrl } from "../config/api";

const API_URL = resolveApiUrl([
    (Constants.expoConfig?.extra as { API_URL?: string } | undefined)?.API_URL,
    process.env.EXPO_PUBLIC_API_URL,
    process.env.API_URL,
]);

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
