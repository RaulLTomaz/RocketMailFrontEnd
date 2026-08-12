import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getToken, clearToken } from "../utils/storage";
import { API_BASE_URL } from "../config/api";

/** Callback de 401 — AuthContext registra `signOut` aqui. */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
    onUnauthorized = fn;
}

const API_URL = API_BASE_URL;

function devLog(...args: unknown[]) {
    if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log(...args);
    }
}

function devError(...args: unknown[]) {
    if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error(...args);
    }
}

if (__DEV__) {
    devLog("[API] baseURL =", API_URL);
}

export const api = axios.create({
    baseURL: API_URL,
    // Render free hiberna; 30s falha no cold start mesmo com /healthz.
    timeout: 60000,
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
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (__DEV__) {
        const method = (config.method ?? "get").toUpperCase();
        devLog("[API] →", method, buildFullUrl(config));
    }

    return config;
});

api.interceptors.response.use(
    (res) => {
        if (__DEV__) {
            const method = (res.config.method ?? "get").toUpperCase();
            const fullUrl = buildFullUrl(res.config as InternalAxiosRequestConfig);
            devLog("[API] ←", res.status, method, fullUrl);
        }
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

        if (__DEV__) {
            if (error.response) {
                devError("[API] ×", error.response.status, method, fullUrl);
            } else if (error.request) {
                devError("[API] × Network/Request error em", method, fullUrl, error.message);
            } else {
                devError("[API] × Erro ao configurar request:", error.message);
            }
        }

        return Promise.reject(error);
    }
);
