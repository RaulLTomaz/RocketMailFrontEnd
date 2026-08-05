export type ThemeMode = "dark" | "light";

export type ThemeColors = {
    background: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    text: string;
    textMuted: string;
    textInverse: string;
    accent: string;
    accentMuted: string;
    like: string;
    danger: string;
    dangerMuted: string;
    overlay: string;
    tabBar: string;
    inputBg: string;
    placeholder: string;
    success: string;
};

export const darkColors: ThemeColors = {
    background: "#070B14",
    surface: "#121826",
    surfaceElevated: "#1A2233",
    border: "#243044",
    text: "#E8EEF8",
    textMuted: "#8B97AD",
    textInverse: "#070B14",
    accent: "#3B9EFF",
    accentMuted: "#1E4A7A",
    like: "#F97316",
    danger: "#F87171",
    dangerMuted: "#4A1F1F",
    overlay: "rgba(0,0,0,0.72)",
    tabBar: "#0C1220",
    inputBg: "#0E1522",
    placeholder: "#6B778C",
    success: "#34D399",
};

export const lightColors: ThemeColors = {
    background: "#F4F7FC",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    border: "#D8E0EC",
    text: "#0B1220",
    textMuted: "#5B6577",
    textInverse: "#FFFFFF",
    accent: "#2B7FFF",
    accentMuted: "#D6E8FF",
    like: "#EA580C",
    danger: "#DC2626",
    dangerMuted: "#FEE2E2",
    overlay: "rgba(7,11,20,0.45)",
    tabBar: "#FFFFFF",
    inputBg: "#FFFFFF",
    placeholder: "#8B97AD",
    success: "#059669",
};

export function colorsFor(mode: ThemeMode): ThemeColors {
    return mode === "light" ? lightColors : darkColors;
}
