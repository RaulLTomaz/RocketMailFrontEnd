/** FastAPI devolve `detail` como string ou lista de validação — unifica para texto na UI. */
export function apiErrorMessage(error: unknown, fallback = "Algo deu errado"): string {
    const e = error as {
        message?: string;
        response?: { data?: { detail?: unknown } };
    };

    const detail = e?.response?.data?.detail;

    if (typeof detail === "string" && detail.trim()) {
        return detail;
    }

    if (Array.isArray(detail)) {
        const parts = detail
            .map((item) => {
                if (typeof item === "string") return item;
                if (item && typeof item === "object" && "msg" in item) {
                    return String((item as { msg: unknown }).msg);
                }
                return null;
            })
            .filter(Boolean);

        if (parts.length) return parts.join("\n");
    }

    if (detail && typeof detail === "object" && "msg" in detail) {
        return String((detail as { msg: unknown }).msg);
    }

    if (typeof e?.message === "string" && e.message.trim()) {
        return e.message;
    }

    return fallback;
}
