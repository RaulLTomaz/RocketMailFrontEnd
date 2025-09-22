import React, { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, me as apiMe, signup as apiSignup, SignupPayload } from "../api/auth";
import { clearToken, getToken, saveToken } from "../utils/storage";

type User = { id: number; nome: string; email: string };

type AuthContextValue = {
    user: User | null;
    loading: boolean;
    signin: (email: string, senha: string) => Promise<void>;
    signup: (data: SignupPayload) => Promise<void>;
    signout: () => Promise<void>;
    refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken();
                if (token) {
                    await refreshMe();
                }
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const signin = async (email: string, senha: string) => {
        const { access_token } = await apiLogin({ email, senha });
        await saveToken(access_token);
        await refreshMe();
    };

    const signup = async (data: SignupPayload) => {
        await apiSignup(data);
        await signin(data.email, data.senha);
    };

    const signout = async () => {
        await clearToken();
        setUser(null);
    };

    const refreshMe = async () => {
        const u = await apiMe();
        setUser(u);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signin, signup, signout, refreshMe }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth deve ser usado dentro de AuthProvider");
    }
    return ctx;
}
