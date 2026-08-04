import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    useCallback,
} from "react";
import { login as apiLogin, signup as apiSignup, me as apiMe } from "../api/auth";
import { listSeguidos, followUser, unfollowUser } from "../api/follow";
import { saveToken, clearToken, getToken } from "../utils/storage";
import { setUnauthorizedHandler } from "../api/client";

type User = {
    id: number;
    nome: string;
    email: string;
    foto_url?: string | null;
};

type AuthContextType = {
    user: User | null;
    loading: boolean;
    followingIds: Set<number>;
    signIn: (p: { email: string; senha: string }) => Promise<void>;
    signUp: (p: { nome: string; email: string; senha: string }) => Promise<void>;
    signOut: () => Promise<void>;
    setUser: (u: User | null) => void;
    isFollowing: (userId: number) => boolean;
    follow: (userId: number) => Promise<void>;
    unfollow: (userId: number) => Promise<void>;
    refreshFollowing: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());

    const refreshFollowing = useCallback(async () => {
        try {
            const list = await listSeguidos();
            setFollowingIds(new Set(list.map((u) => u.id)));
        } catch {
            setFollowingIds(new Set());
        }
    }, []);

    const hydrate = async () => {
        try {
            const token = await getToken();
            if (!token) return;
            const me = await apiMe();
            setUser(me);
            await refreshFollowing();
        } catch {
            try {
                await clearToken();
            } catch {}
            setUser(null);
            setFollowingIds(new Set());
        }
    };

    useEffect(() => {
        (async () => {
            await hydrate();
            setLoading(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const signIn = useCallback(
        async ({ email, senha }: { email: string; senha: string }) => {
            const data = await apiLogin({ email, senha });
            await saveToken(data.access_token);
            const me = await apiMe();
            setUser(me);
            await refreshFollowing();
        },
        [refreshFollowing]
    );

    const signUp = useCallback(
        async ({ nome, email, senha }: { nome: string; email: string; senha: string }) => {
            await apiSignup({ nome, email, senha });
            const data = await apiLogin({ email, senha });
            await saveToken(data.access_token);
            const me = await apiMe();
            setUser(me);
            await refreshFollowing();
        },
        [refreshFollowing]
    );

    const signOut = useCallback(async () => {
        await clearToken();
        setUser(null);
        setFollowingIds(new Set());
    }, []);

    const isFollowing = useCallback(
        (userId: number) => followingIds.has(userId),
        [followingIds]
    );

    const follow = useCallback(async (userId: number) => {
        await followUser(userId);
        setFollowingIds((prev) => new Set(prev).add(userId));
    }, []);

    const unfollow = useCallback(async (userId: number) => {
        await unfollowUser(userId);
        setFollowingIds((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
        });
    }, []);

    useEffect(() => {
        setUnauthorizedHandler(() => {
            void signOut();
        });
    }, [signOut]);

    const value = useMemo(
        () => ({
            user,
            loading,
            followingIds,
            signIn,
            signUp,
            signOut,
            setUser,
            isFollowing,
            follow,
            unfollow,
            refreshFollowing,
        }),
        [
            user,
            loading,
            followingIds,
            signIn,
            signUp,
            signOut,
            isFollowing,
            follow,
            unfollow,
            refreshFollowing,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}
