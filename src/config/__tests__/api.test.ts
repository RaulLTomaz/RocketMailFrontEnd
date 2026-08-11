import { resolveApiUrl, API_BASE_URL } from "../api";

describe("resolveApiUrl", () => {
    it("usa o Django como default", () => {
        expect(resolveApiUrl()).toBe(API_BASE_URL);
        expect(resolveApiUrl([])).toBe(API_BASE_URL);
    });

    it("ignora a URL antiga do FastAPI e cai no Django", () => {
        expect(resolveApiUrl(["https://rocketmail-api.onrender.com"])).toBe(API_BASE_URL);
        expect(
            resolveApiUrl([
                "https://rocketmail-api.onrender.com",
                "https://rocketmail-django.onrender.com",
            ])
        ).toBe(API_BASE_URL);
    });

    it("aceita localhost para desenvolvimento", () => {
        expect(resolveApiUrl(["http://localhost:8000"])).toBe("http://localhost:8000");
        expect(resolveApiUrl(["http://127.0.0.1:8000"])).toBe("http://127.0.0.1:8000");
    });
});
