import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, Theme as NavTheme } from "@react-navigation/native";
import { colorsFor, ThemeColors, ThemeMode } from "./colors";

const STORAGE_KEY = "@rocketmail/theme";

type ThemeContextValue = {
    mode: ThemeMode;
    colors: ThemeColors;
    isDark: boolean;
    ready: boolean;
    setMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
    navigationTheme: NavTheme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function buildNavTheme(mode: ThemeMode, colors: ThemeColors): NavTheme {
    const base = mode === "dark" ? DarkTheme : DefaultTheme;
    return {
        ...base,
        dark: mode === "dark",
        colors: {
            ...base.colors,
            primary: colors.accent,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            notification: colors.like,
        },
    };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>("dark");
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                if (!cancelled && (saved === "dark" || saved === "light")) {
                    setModeState(saved);
                }
            } catch {
                // keep default dark
            } finally {
                if (!cancelled) setReady(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const setMode = useCallback((next: ThemeMode) => {
        setModeState(next);
        void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    }, []);

    const toggleTheme = useCallback(() => {
        setModeState((prev) => {
            const next: ThemeMode = prev === "dark" ? "light" : "dark";
            void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
            return next;
        });
    }, []);

    const colors = useMemo(() => colorsFor(mode), [mode]);
    const navigationTheme = useMemo(() => buildNavTheme(mode, colors), [mode, colors]);

    const value = useMemo<ThemeContextValue>(
        () => ({
            mode,
            colors,
            isDark: mode === "dark",
            ready,
            setMode,
            toggleTheme,
            navigationTheme,
        }),
        [mode, colors, ready, setMode, toggleTheme, navigationTheme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return ctx;
}
