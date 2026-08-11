import { resolveApiUrl, DEFAULT_API_URL } from "../api";

describe("resolveApiUrl", () => {
    it("usa o Django como default", () => {
        expect(resolveApiUrl([])).toBe(DEFAULT_API_URL);
    });

    it("ignora a URL antiga do FastAPI", () => {
        expect(
            resolveApiUrl([
                "https://rocketmail-api.onrender.com",
                "https://rocketmail-django.onrender.com",
            ])
        ).toBe("https://rocketmail-django.onrender.com");
    });

    it("aceita localhost para desenvolvimento", () => {
        expect(resolveApiUrl(["http://localhost:8000"])).toBe("http://localhost:8000");
    });
});
