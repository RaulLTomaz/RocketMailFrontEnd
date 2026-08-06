import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

type Props = {
    size?: "sm" | "md";
};

export default function ThemeToggle({ size = "md" }: Props) {
    const { mode, colors, toggleTheme } = useTheme();
    const isDark = mode === "dark";
    const label = isDark ? "Escuro" : "Claro";
    const nextLabel = isDark ? "Claro" : "Escuro";
    const padV = size === "sm" ? 6 : 8;
    const padH = size === "sm" ? 10 : 12;

    return (
        <Pressable
            onPress={toggleTheme}
            accessibilityRole="button"
            accessibilityLabel={`Tema ${label}. Toque para ativar tema ${nextLabel}`}
            style={({ pressed }) => [
                styles.btn,
                {
                    paddingVertical: padV,
                    paddingHorizontal: padH,
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                    opacity: pressed ? 0.8 : 1,
                },
            ]}
        >
            <View style={styles.row}>
                <Text
                    style={[
                        styles.icon,
                        { color: colors.accent, fontSize: size === "sm" ? 14 : 16 },
                    ]}
                >
                    {isDark ? "☀" : "☾"}
                </Text>
                <Text
                    style={[
                        styles.label,
                        {
                            color: colors.text,
                            fontSize: size === "sm" ? 13 : 14,
                        },
                    ]}
                >
                    {label}
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    btn: {
        borderRadius: 20,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    icon: {
        fontWeight: "600",
    },
    label: {
        fontWeight: "600",
    },
});
