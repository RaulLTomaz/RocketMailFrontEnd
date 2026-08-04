process.env.API_URL =
    process.env.API_URL || "https://rocketmail-api.onrender.com";

jest.mock("expo-constants", () => ({
    __esModule: true,
    default: {
        expoConfig: {
            extra: {
                API_URL: process.env.API_URL,
            },
        },
    },
}));
