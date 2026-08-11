/** Única API do RocketMail: backend Django no Render. */
export const API_BASE_URL = "https://rocketmail-django.onrender.com";

/** @deprecated Use `API_BASE_URL`. Mantido para imports antigos. */
export const DEFAULT_API_URL = API_BASE_URL;

/**
 * Sempre usa o Django em produção.
 * Só aceita override local (`localhost` / `127.0.0.1`) para desenvolvimento.
 * Qualquer outra URL (incluindo o FastAPI antigo) é descartada.
 */
export function resolveApiUrl(candidates: Array<string | null | undefined> = []): string {
    for (const raw of candidates) {
        const url = (raw || "").trim().replace(/\/+$/, "");
        if (!url) continue;
        if (/rocketmail-api\.onrender\.com/i.test(url)) continue;
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url)) {
            return url;
        }
        if (/rocketmail-django\.onrender\.com/i.test(url)) {
            return API_BASE_URL;
        }
    }
    return API_BASE_URL;
}
