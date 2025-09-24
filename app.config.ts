import "dotenv/config";

export default {
    expo: {
        name: "RocketMailApp",
        slug: "RocketMailApp",
        extra: {
            API_URL: process.env.API_URL,
        },
        plugins: [
            "expo-secure-store",
        ],
    },
};
