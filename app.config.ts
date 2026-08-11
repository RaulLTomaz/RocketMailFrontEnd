import "dotenv/config";
import type { ConfigContext, ExpoConfig } from "expo/config";

const DEFAULT_API_URL = "https://rocketmail-django.onrender.com";

function resolveApiUrl(...candidates: Array<string | undefined>): string {
    for (const raw of candidates) {
        const url = (raw || "").trim().replace(/\/+$/, "");
        if (!url) continue;
        // Build no Vercel pode ainda ter a env antiga do FastAPI — ignora.
        if (/rocketmail-api\.onrender\.com/i.test(url)) continue;
        return url;
    }
    return DEFAULT_API_URL;
}

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: config.name ?? "RocketMailApp",
    slug: config.slug ?? "RocketMailApp",
    extra: {
        ...(config.extra ?? {}),
        API_URL: resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, process.env.API_URL),
    },
});
