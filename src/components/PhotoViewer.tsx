import React from "react";
import {
    Modal,
    View,
    Image,
    Pressable,
    Text,
    StyleSheet,
    useWindowDimensions,
    ActivityIndicator,
} from "react-native";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { useTheme } from "../theme/ThemeContext";
import Button from "./ui/Button";

type Props = {
    visible: boolean;
    uri?: string | null;
    nome?: string | null;
    onClose: () => void;
    /** Ações de foto ficam só no viewer e só para o dono do perfil. */
    isOwner?: boolean;
    fotoBusy?: boolean;
    onChangePhoto?: () => void;
    onRemovePhoto?: () => void;
};

export default function PhotoViewer({
    visible,
    uri,
    nome,
    onClose,
    isOwner,
    fotoBusy,
    onChangePhoto,
    onRemovePhoto,
}: Props) {
    const { width, height } = useWindowDimensions();
    const { colors } = useTheme();
    const resolved = resolveMediaUrl(uri);
    const maxW = Math.min(width - 32, 720);
    const maxH = Math.min(height - 220, 720);

    if (!visible) return null;

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

                {resolved ? (
                    <Image
                        source={{ uri: resolved }}
                        style={{
                            width: maxW,
                            height: maxH,
                            backgroundColor: "#111",
                        }}
                        resizeMode="contain"
                        accessibilityLabel={nome ? `Foto de ${nome}` : "Foto de perfil"}
                    />
                ) : (
                    <View
                        style={[
                            styles.empty,
                            {
                                width: Math.min(maxW, 320),
                                height: Math.min(maxH, 240),
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <Text style={styles.emptyText}>Sem foto de perfil</Text>
                        {nome ? (
                            <Text style={[styles.emptyName, { color: colors.textMuted }]}>
                                {nome}
                            </Text>
                        ) : null}
                    </View>
                )}

                {resolved && nome ? <Text style={styles.caption}>{nome}</Text> : null}

                {isOwner ? (
                    <View style={styles.actions}>
                        {fotoBusy ? (
                            <ActivityIndicator color={colors.accent} />
                        ) : (
                            <>
                                <Button
                                    title={resolved ? "Alterar foto" : "Adicionar foto"}
                                    onPress={onChangePhoto}
                                    style={styles.actionBtn}
                                />
                                {resolved ? (
                                    <Button
                                        title="Remover foto"
                                        variant="danger"
                                        onPress={onRemovePhoto}
                                        style={styles.actionBtn}
                                    />
                                ) : null}
                            </>
                        )}
                    </View>
                ) : null}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.94)",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
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
    empty: {
        borderWidth: 1,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 24,
    },
    emptyText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    emptyName: {
        fontSize: 14,
    },
    caption: {
        marginTop: 12,
        fontSize: 16,
        color: "#ddd",
    },
    actions: {
        marginTop: 24,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        justifyContent: "center",
        maxWidth: 400,
        width: "100%",
        paddingHorizontal: 16,
    },
    actionBtn: {
        minWidth: 140,
        flexGrow: 1,
    },
});
