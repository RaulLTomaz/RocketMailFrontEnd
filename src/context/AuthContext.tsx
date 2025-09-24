import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as apiLogin, signup as apiSignup, me as apiMe } from "../api/auth";
import { saveToken, clearToken, getToken } from "../utils/storage";
import { setUnauthorizedHandler } from "../api/client"; // <-- novo

type User = { id: number; nome: string; email: string };

type AuthContextType = {
    user: User | null;
    loading: boolean;
    signIn: (p: { email: string; senha: string }) => Promise<void>;
    signUp: (p: { nome: string; email: string; senha: string }) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const hydrate = async () => {
        try {
            const token = await getToken();
            if (!token) return;
            const me = await apiMe();
            setUser(me);
        } catch {
            // token inválido/expirado
        }
    };

    useEffect(() => {
        (async () => {
            await hydrate();
            setLoading(false);
        })();
    }, []);

    const signIn = async ({ email, senha }: { email: string; senha: string }) => {
        const data = await apiLogin({ email, senha });
        await saveToken(data.access_token);
        const me = await apiMe();
        setUser(me);
    };

    const signUp = async ({ nome, email, senha }: { nome: string; email: string; senha: string }) => {
        await apiSignup({ nome, email, senha });
        const data = await apiLogin({ email, senha });
        await saveToken(data.access_token);
        const me = await apiMe();
        setUser(me);
    };

    const signOut = async () => {
        await clearToken();
        setUser(null);
    };

    // ===== novo: registra callback global p/ 401 =====
    useEffect(() => {
        setUnauthorizedHandler(() => {
            // se qualquer request retornar 401, cai aqui
            signOut();
        });
    }, [signOut]);

    const value = useMemo(() => ({ user, loading, signIn, signUp, signOut }), [user, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
