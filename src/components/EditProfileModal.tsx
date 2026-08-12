import React from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import TextField from "./ui/TextField";
import Button from "./ui/Button";

type Props = {
    visible: boolean;
    nome: string;
    email: string;
    senha: string;
    saving: boolean;
    onChangeNome: (v: string) => void;
    onChangeEmail: (v: string) => void;
    onChangeSenha: (v: string) => void;
    onCancel: () => void;
    onSave: () => void;
};

export default function EditProfileModal({
    visible,
    nome,
    email,
    senha,
    saving,
    onChangeNome,
    onChangeEmail,
    onChangeSenha,
    onCancel,
    onSave,
}: Props) {
    const { colors } = useTheme();

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
                <View
                    style={[
                        styles.modalCard,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                        Editar perfil
                    </Text>
                    <TextField
                        placeholder="Nome"
                        accessibilityLabel="Nome"
                        value={nome}
                        onChangeText={onChangeNome}
                        editable={!saving}
                    />
                    <TextField
                        placeholder="E-mail"
                        accessibilityLabel="E-mail"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={onChangeEmail}
                        editable={!saving}
                    />
                    <TextField
                        placeholder="Nova senha (opcional)"
                        accessibilityLabel="Nova senha (opcional)"
                        secureTextEntry
                        value={senha}
                        onChangeText={onChangeSenha}
                        editable={!saving}
                    />
                    {senha.trim() ? (
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>
                            Senha: 8+ chars, maiúscula, número e símbolo
                        </Text>
                    ) : null}
                    <View style={styles.modalActions}>
                        <Pressable
                            onPress={onCancel}
                            disabled={saving}
                            accessibilityRole="button"
                            accessibilityLabel="Cancelar edição"
                        >
                            <Text style={[styles.cancel, { color: colors.textMuted }]}>
                                Cancelar
                            </Text>
                        </Pressable>
                        <Button
                            title={saving ? "Salvando..." : "Salvar"}
                            onPress={onSave}
                            disabled={saving}
                            loading={saving}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
        alignItems: "center",
    },
    modalCard: {
        borderRadius: 14,
        padding: 16,
        gap: 10,
        borderWidth: 1,
        width: "100%",
        maxWidth: 400,
    },
    modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
    modalActions: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 8,
    },
    cancel: { fontSize: 16, padding: 8 },
});
