import "dotenv/config";
import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: config.name ?? "RocketMailApp",
    slug: config.slug ?? "RocketMailApp",
    extra: {
        ...(config.extra ?? {}),
        API_URL: process.env.API_URL || process.env.EXPO_PUBLIC_API_URL,
    },
});
