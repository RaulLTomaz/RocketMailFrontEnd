import React from "react";
import {
    Modal,
    View,
    Image,
    Pressable,
    Text,
    StyleSheet,
    useWindowDimensions,
} from "react-native";
import { resolveMediaUrl } from "../utils/mediaUrl";

type Props = {
    visible: boolean;
    uri?: string | null;
    nome?: string | null;
    onClose: () => void;
};

/** Visualização em tela cheia da foto de perfil. */
export default function PhotoViewer({ visible, uri, nome, onClose }: Props) {
    const { width, height } = useWindowDimensions();
    const resolved = resolveMediaUrl(uri);

    if (!resolved) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.backdrop}>
                <Pressable style={styles.closeHit} onPress={onClose} accessibilityRole="button">
                    <Text style={styles.closeText}>Fechar</Text>
                </Pressable>
                <Image
                    source={{ uri: resolved }}
                    style={{
                        width: Math.min(width - 24, height - 120),
                        height: Math.min(width - 24, height - 120),
                        borderRadius: 8,
                    }}
                    resizeMode="contain"
                    accessibilityLabel={nome ? `Foto de ${nome}` : "Foto de perfil"}
                />
                {nome ? <Text style={styles.caption}>{nome}</Text> : null}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.92)",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
    },
    closeHit: {
        position: "absolute",
        top: 48,
        right: 20,
        zIndex: 2,
        padding: 8,
    },
    closeText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    caption: {
        marginTop: 16,
        color: "#ddd",
        fontSize: 16,
    },
});
