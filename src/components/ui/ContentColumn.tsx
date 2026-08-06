import React from "react";
import { StyleSheet, View, StyleProp, ViewStyle } from "react-native";

export const CONTENT_MAX_WIDTH = 560;
export const AUTH_MAX_WIDTH = 400;

type Props = {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    /** Padrão 560; use `AUTH_MAX_WIDTH` em login/cadastro. */
    maxWidth?: number;
    /**
     * Com `true` (padrão), ocupa a altura do pai.
     * Use `false` dentro de formulários com ScrollView.
     */
    fill?: boolean;
};

/** Limita largura e centraliza conteúdo em viewports largas (web). */
export default function ContentColumn({
    children,
    style,
    maxWidth = CONTENT_MAX_WIDTH,
    fill = true,
}: Props) {
    return (
        <View style={[styles.outer, fill && styles.fill]}>
            {/* `style` no inner: gap/padding precisam valer nos filhos, não no wrapper. */}
            <View style={[styles.inner, fill && styles.fill, { maxWidth }, style]}>
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
