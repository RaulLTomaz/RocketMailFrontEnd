import axios from "axios";
import Constants from "expo-constants";
import { getToken } from "../utils/storage";

const API_URL =
    (Constants.expoConfig?.extra as any)?.API_URL ||
    process.env.API_URL ||
    "http://localhost:8000";

export const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
});

api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
