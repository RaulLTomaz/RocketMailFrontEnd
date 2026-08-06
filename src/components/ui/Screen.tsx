import React from "react";
import { StyleSheet, View, ViewProps, StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeContext";

type Props = ViewProps & {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    edges?: ("top" | "right" | "bottom" | "left")[];
    /** `false` evita SafeArea aninhada (ex.: já dentro de outro Screen). */
    safe?: boolean;
};

export default function Screen({
    children,
    style,
    edges = ["top", "left", "right"],
    safe = true,
    ...rest
}: Props) {
    const { colors } = useTheme();
    const containerStyle = [
        styles.root,
        { backgroundColor: colors.background },
        style,
    ];

    if (!safe) {
        return (
            <View style={containerStyle} {...rest}>
                {children}
            </View>
        );
    }

    return (
        <SafeAreaView style={containerStyle} edges={edges} {...rest}>
            {children}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
});
