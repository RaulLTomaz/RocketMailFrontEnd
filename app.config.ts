import type { ExpoConfig, ConfigContext } from "expo/config";
import "dotenv/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "RocketMailApp",
    slug: "rocketmail-app",
    extra: {
        API_URL: process.env.API_URL ?? "https://rocketmail-api.onrender.com",
    },
});
