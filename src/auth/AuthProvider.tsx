import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { saveToken, getToken, clearToken } from "../utils/storage";

type User = {
    id: number;
    nome: string;
    email: string;
} | null;

type AuthContextType = {
    user: User;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => {},
    logout: async () => {},
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const token = await getToken();
            if (token) {
                try {
                    const me = await api.get("/usuario/me");
                    setUser(me.data);
                } catch {
                    await clearToken();
                    setUser(null);
                }
            }
            setLoading(false);
        })();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await api.post(
            "/usuario/login",
            new URLSearchParams({ username: email, password }).toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const token: string = res.data.access_token;
        await saveToken(token);

        const me = await api.get("/usuario/me");
        setUser(me.data);
    }, []);

    const logout = useCallback(async () => {
        await clearToken();
        setUser(null);
    }, []);

    const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
