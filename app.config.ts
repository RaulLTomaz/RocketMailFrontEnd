import type { ConfigContext, ExpoConfig } from "expo/config";

/** URL da API Django — fixa no config para o build (ex.: Vercel) não herdar env desatualizada. */
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
