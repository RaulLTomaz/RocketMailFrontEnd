import React from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    ViewStyle,
    StyleProp,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";

type Variant = "primary" | "ghost" | "danger";

type Props = {
    title: string;
    onPress?: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: Variant;
    style?: StyleProp<ViewStyle>;
};

export default function Button({
    title,
    onPress,
    disabled,
    loading,
    variant = "primary",
    style,
}: Props) {
    const { colors } = useTheme();
    const isDisabled = disabled || loading;

    const bg =
        variant === "primary"
            ? colors.accent
            : variant === "danger"
              ? colors.dangerMuted
              : "transparent";
    const border =
        variant === "ghost"
            ? colors.border
            : variant === "danger"
              ? colors.danger
              : "transparent";
    const textColor =
        variant === "primary"
            ? colors.textInverse
            : variant === "danger"
              ? colors.danger
              : colors.text;

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.base,
                {
                    backgroundColor: bg,
                    borderColor: border,
                    opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
                },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={textColor} />
            ) : (
                <Text style={[styles.label, { color: textColor }]}>{title}</Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        minHeight: 44,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    label: {
        fontSize: 15,
        fontWeight: "600",
    },
});
