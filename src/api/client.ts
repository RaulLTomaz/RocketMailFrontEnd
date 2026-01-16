import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Constants from "expo-constants";
import { getToken, clearToken } from "../utils/storage";

// handler para 401 (registrado pelo AuthContext)
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
    onUnauthorized = fn;
}

const API_URL =
    (Constants.expoConfig?.extra as any)?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL || // aceita as duas
    process.env.API_URL ||
    "http://localhost:8000";

console.log("[API] baseURL =", API_URL);

export const api = axios.create({
    baseURL: API_URL,
    timeout: 0,
});

function buildFullUrl(config: InternalAxiosRequestConfig): string {
    const base = (config.baseURL ?? API_URL) || "";
    const path = typeof config.url === "string" ? config.url : "";
    if (/^https?:\/\//i.test(path)) return path;
    const left = base.replace(/\/+$/, "");
    const right = path.replace(/^\/+/, "");
    return `${left}/${right}`;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
        // console.log("[API] auth header set"); // debug opcional
    } else {
        // console.log("[API] sem token no request"); // debug opcional
    }

    const method = (config.method ?? "get").toUpperCase();
    const fullUrl = buildFullUrl(config);
    console.log("[API] →", method, fullUrl);

    return config;
});

api.interceptors.response.use(
    (res) => {
        const method = (res.config.method ?? "get").toUpperCase();
        const fullUrl = buildFullUrl(res.config as InternalAxiosRequestConfig);
        console.log("[API] ←", res.status, method, fullUrl);
        return res;
    },
    async (error: AxiosError) => {
        const cfg = (error.config ?? {}) as InternalAxiosRequestConfig;
        const method = (cfg.method ?? "get").toUpperCase();
        const fullUrl = buildFullUrl(cfg);

        const status = error?.response?.status;

        if (status === 401) {
            try {
                await clearToken();
            } catch {}
            if (onUnauthorized) {
                try {
                    onUnauthorized();
                } catch {}
            }
        }

        if (error.response) {
            console.error("[API] ×", error.response.status, method, fullUrl, error.response.data);
        } else if (error.request) {
            console.error("[API] × Network/Request error em", method, fullUrl, error.message);
        } else {
            console.error("[API] × Erro ao configurar request:", error.message);
        }

        return Promise.reject(error);
    }
);
