import React from "react";
import { StyleSheet, View, StyleProp, ViewStyle, useWindowDimensions } from "react-native";

export const CONTENT_MAX_WIDTH = 560;
export const AUTH_MAX_WIDTH = 400;

type Props = {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    /** Default 560; use AUTH_MAX_WIDTH for login/signup. */
    maxWidth?: number;
    /** When true (default), fills parent height — use false inside ScrollView forms. */
    fill?: boolean;
};

/** Centraliza o conteúdo e limita a largura em telas grandes (web). */
export default function ContentColumn({
    children,
    style,
    maxWidth = CONTENT_MAX_WIDTH,
    fill = true,
}: Props) {
    const { width } = useWindowDimensions();
    const capped = Math.min(width, maxWidth);

    return (
        <View style={[styles.outer, fill && styles.fill, style]}>
            <View style={[styles.inner, fill && styles.fill, { width: capped, maxWidth }]}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outer: {
        width: "100%",
        alignItems: "center",
    },
    fill: {
        flex: 1,
    },
    inner: {
        width: "100%",
    },
});
