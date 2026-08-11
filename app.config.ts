import type { ConfigContext, ExpoConfig } from "expo/config";

/** API Django — hardcoded para o build (Vercel) não herdar env antiga do FastAPI. */
const API_BASE_URL = "https://rocketmail-django.onrender.com";

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: config.name ?? "RocketMailApp",
    slug: config.slug ?? "RocketMailApp",
    extra: {
        ...(config.extra ?? {}),
        API_URL: API_BASE_URL,
    },
});
