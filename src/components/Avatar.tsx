import React from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    StyleProp,
    ViewStyle,
    ImageStyle,
} from "react-native";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { useTheme } from "../theme/ThemeContext";

type Size = "sm" | "md" | "lg";

type Props = {
    nome?: string | null;
    /** URL da foto (absoluta ou relativa `/media/...`) */
    uri?: string | null;
    size?: Size;
    style?: StyleProp<ViewStyle | ImageStyle>;
};

const SIZES: Record<Size, number> = {
    sm: 40,
    md: 56,
    lg: 88,
};

const PALETTE = ["#3B9EFF", "#0EA5E9", "#38BDF8", "#14B8A6", "#F97316", "#F87171"];

function initialsFromName(nome?: string | null): string {
    const parts = (nome || "?").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorFromName(nome?: string | null): string {
    const s = nome || "?";
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
    return PALETTE[Math.abs(hash) % PALETTE.length];
}

/** Avatar com foto ou placeholder de iniciais. */
export default function Avatar({ nome, uri, size = "sm", style }: Props) {
    const { colors } = useTheme();
    const dim = SIZES[size];
    const radius = dim / 2;
    const initials = initialsFromName(nome);
    const bg = colorFromName(nome);
    const resolved = resolveMediaUrl(uri);
    const [failed, setFailed] = React.useState(false);

    React.useEffect(() => {
        setFailed(false);
    }, [resolved]);

    if (resolved && !failed) {
        return (
            <Image
                source={{ uri: resolved }}
                onError={() => setFailed(true)}
                style={
                    [
                        {
                            width: dim,
                            height: dim,
                            borderRadius: radius,
                            backgroundColor: colors.border,
                            borderWidth: StyleSheet.hairlineWidth,
                            borderColor: colors.border,
                        },
                        style,
                    ] as any
                }
                accessibilityLabel={`Foto de ${nome ?? "usuário"}`}
            />
        );
    }

    return (
        <View
            style={[
                styles.placeholder,
                {
                    width: dim,
                    height: dim,
                    borderRadius: radius,
                    backgroundColor: bg,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.border,
                },
                style as StyleProp<ViewStyle>,
            ]}
            accessibilityLabel={`Avatar de ${nome ?? "usuário"}`}
        >
            <Text style={[styles.initials, { fontSize: dim * 0.36 }]}>{initials}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    placeholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    initials: {
        color: "#fff",
        fontWeight: "700",
    },
});
