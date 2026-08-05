import { resolveMediaUrl } from "../mediaUrl";

jest.mock("expo-constants", () => ({
    __esModule: true,
    default: {
        expoConfig: {
            extra: { API_URL: "https://rocketmail-api.onrender.com" },
        },
    },
}));

describe("resolveMediaUrl", () => {
    it("retorna null para vazio", () => {
        expect(resolveMediaUrl(null)).toBeNull();
        expect(resolveMediaUrl("")).toBeNull();
        expect(resolveMediaUrl("   ")).toBeNull();
    });

    it("mantém URLs absolutas e data:", () => {
        expect(resolveMediaUrl("https://cdn.example/a.jpg")).toBe(
            "https://cdn.example/a.jpg"
        );
        expect(
            resolveMediaUrl(
                "https://res.cloudinary.com/demo/image/upload/v1/rocketmail/avatars/user_1.jpg"
            )
        ).toBe(
            "https://res.cloudinary.com/demo/image/upload/v1/rocketmail/avatars/user_1.jpg"
        );
        expect(resolveMediaUrl("data:image/png;base64,xx")).toBe(
            "data:image/png;base64,xx"
        );
    });

    it("prefixa path relativo com API_URL", () => {
        expect(resolveMediaUrl("/media/avatars/user_1.png")).toBe(
            "https://rocketmail-api.onrender.com/media/avatars/user_1.png"
        );
    });
});
