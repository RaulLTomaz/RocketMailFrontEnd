/** URL pública da API Django (Render). */
export const DEFAULT_API_URL = "https://rocketmail-django.onrender.com";

/**
 * Resolve a base URL da API.
 * Ignora valores antigos (ex.: FastAPI `rocketmail-api`) para o build
 * de produção no Vercel não continuar apontando para o backend errado.
 */
export function resolveApiUrl(candidates: Array<string | null | undefined>): string {
    for (const raw of candidates) {
        const url = (raw || "").trim().replace(/\/+$/, "");
        if (!url) continue;
        if (/rocketmail-api\.onrender\.com/i.test(url)) continue;
        return url;
    }
    return DEFAULT_API_URL;
}
