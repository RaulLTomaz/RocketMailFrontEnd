import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ActivityIndicator,
} from "react-native";
import type { UsuarioOut } from "../api/users";
import { useTheme } from "../theme/ThemeContext";
import Avatar from "./Avatar";
import Button from "./ui/Button";
import ThemeToggle from "./ThemeToggle";

type Stats = {
    posts: number;
    seguidores: number;
    seguindo: number;
};

type Props = {
    user: UsuarioOut;
    stats: Stats | null;
    isMe: boolean;
    following: boolean;
    followBusy: boolean;
    fotoBusy: boolean;
    hasPhoto: boolean;
    onAvatarPress: () => void;
    onToggleFollow: () => void;
    onOpenEdit: () => void;
    onDeleteAccount: () => void;
    onSignOut: () => void;
    onPressSeguidores?: () => void;
    onPressSeguindo?: () => void;
};

export default function ProfileHeader({
    user,
    stats,
    isMe,
    following,
    followBusy,
    fotoBusy,
    hasPhoto,
    onAvatarPress,
    onToggleFollow,
    onOpenEdit,
    onDeleteAccount,
    onSignOut,
    onPressSeguidores,
    onPressSeguindo,
}: Props) {
    const { colors } = useTheme();

    return (
        <View style={styles.header}>
            <View style={styles.themeRow}>
                <Text style={[styles.themeLabel, { color: colors.textMuted }]}>
                    Aparência
                </Text>
                <View style={styles.headerActions}>
                    <ThemeToggle size="sm" />
                    <Button title="Sair" variant="ghost" onPress={onSignOut} />
                </View>
            </View>

            <View style={styles.identityRow}>
                <Pressable
                    onPress={onAvatarPress}
                    disabled={fotoBusy || (!isMe && !hasPhoto)}
                    accessibilityRole="button"
                    accessibilityLabel={
                        hasPhoto || isMe
                            ? `Foto de ${user.nome}`
                            : `Avatar de ${user.nome}`
                    }
                    accessibilityHint={
                        hasPhoto || isMe
                            ? "Toque para ver a foto em tela cheia"
                            : undefined
                    }
                >
                    <View>
                        <Avatar nome={user.nome} uri={user.foto_url} size="lg" />
                        {fotoBusy ? (
                            <View style={styles.avatarBusy}>
                                <ActivityIndicator color="#fff" />
                            </View>
                        ) : null}
                    </View>
                </Pressable>
                <View style={styles.identityText}>
                    <Text style={[styles.name, { color: colors.text }]}>{user.nome}</Text>
                    <Text style={[styles.email, { color: colors.textMuted }]}>
                        {user.email}
                    </Text>
                    {isMe || hasPhoto ? (
                        <Text style={[styles.hint, { color: colors.textMuted }]}>
                            Toque na foto para gerenciar
                        </Text>
                    ) : null}
                </View>
            </View>

            {stats ? (
                <View style={styles.counters}>
                    <Text style={[styles.counter, { color: colors.text }]}>
                        <Text style={{ fontWeight: "700" }}>{stats.posts}</Text> posts
                    </Text>
                    <Text style={[styles.dot, { color: colors.textMuted }]}>•</Text>
                    <Pressable
                        onPress={onPressSeguidores}
                        disabled={!onPressSeguidores}
                        accessibilityRole={onPressSeguidores ? "button" : undefined}
                        accessibilityLabel={`${stats.seguidores} seguidores`}
                    >
                        <Text style={[styles.counter, { color: colors.text }]}>
                            <Text style={{ fontWeight: "700" }}>{stats.seguidores}</Text>{" "}
                            seguidores
                        </Text>
                    </Pressable>
                    <Text style={[styles.dot, { color: colors.textMuted }]}>•</Text>
                    <Pressable
                        onPress={onPressSeguindo}
                        disabled={!onPressSeguindo}
                        accessibilityRole={onPressSeguindo ? "button" : undefined}
                        accessibilityLabel={`${stats.seguindo} seguindo`}
                    >
                        <Text style={[styles.counter, { color: colors.text }]}>
                            <Text style={{ fontWeight: "700" }}>{stats.seguindo}</Text> seguindo
                        </Text>
                    </Pressable>
                </View>
            ) : null}

            {isMe ? (
                <Text
                    style={[
                        styles.badge,
                        {
                            backgroundColor: colors.accentMuted,
                            color: colors.accent,
                        },
                    ]}
                >
                    Seu perfil
                </Text>
            ) : null}

            <View style={styles.actionsRow}>
                {!isMe ? (
                    <Button
                        title={
                            followBusy
                                ? "..."
                                : following
                                  ? "Deixar de seguir"
                                  : "Seguir"
                        }
                        onPress={onToggleFollow}
                        disabled={followBusy}
                        loading={followBusy}
                        variant={following ? "ghost" : "primary"}
                    />
                ) : (
                    <>
                        <Button title="Editar perfil" onPress={onOpenEdit} variant="ghost" />
                        <Button
                            title="Excluir conta"
                            variant="danger"
                            onPress={onDeleteAccount}
                        />
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 10 },
    themeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    themeLabel: { fontSize: 14, fontWeight: "500" },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    identityRow: { flexDirection: "row", alignItems: "center", gap: 14 },
    identityText: { flex: 1, minWidth: 0, gap: 2 },
    name: { fontSize: 22, fontWeight: "800" },
    email: { fontSize: 14 },
    hint: { fontSize: 12, marginTop: 4 },
    avatarBusy: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.35)",
        borderRadius: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    counters: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
        flexWrap: "wrap",
    },
    counter: { fontSize: 14 },
    dot: {},
    badge: {
        marginTop: 2,
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: "600",
        overflow: "hidden",
    },
    actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
});
