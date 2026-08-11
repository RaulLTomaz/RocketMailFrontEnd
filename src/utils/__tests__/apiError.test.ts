import { apiErrorMessage } from "../apiError";

describe("apiErrorMessage", () => {
    it("retorna detail string da API", () => {
        expect(
            apiErrorMessage({ response: { data: { detail: "Credenciais inválidas" } } })
        ).toBe("Credenciais inválidas");
    });

    it("normaliza lista de validação da API", () => {
        expect(
            apiErrorMessage({
                response: {
                    data: {
                        detail: [
                            { msg: "campo obrigatório", loc: ["body", "email"] },
                            { msg: "mínimo 6 caracteres" },
                        ],
                    },
                },
            })
        ).toBe("campo obrigatório\nmínimo 6 caracteres");
    });

    it("usa message genérica se não houver detail", () => {
        expect(apiErrorMessage({ message: "Network Error" })).toBe("Network Error");
    });

    it("usa fallback quando não há info útil", () => {
        expect(apiErrorMessage({}, "Falha no login")).toBe("Falha no login");
    });
});
