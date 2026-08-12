import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
    Platform,
    ActivityIndicator,
} from "react-native";
import type { PostWithLikes } from "../api/posts";
import { likePost, unlikePost } from "../api/likes";
import { deletePost } from "../api/posts";
import { apiErrorMessage } from "../utils/apiError";
import { useTheme } from "../theme/ThemeContext";
import Avatar from "./Avatar";

type Props = {
    item: PostWithLikes;
    currentUserId?: number | null;
    onPressAuthor?: (userId: number) => void;
    onDeleted?: (postId: number) => void;
    onLikeChange?: (postId: number, likedByMe: boolean, likeCount: number) => void;
};

export default function PostCard({
    item,
    currentUserId,
    onPressAuthor,
    onDeleted,
    onLikeChange,
}: Props) {
    const { colors } = useTheme();
    const [liking, setLiking] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isMine = currentUserId != null && item.usuario?.id === currentUserId;

    let when: string | undefined;
    if (item.data_criacao) {
        try {
            when = new Date(item.data_criacao).toLocaleString();
        } catch {}
    }

    const toggleLike = async () => {
        if (liking) return;
        setLiking(true);
        const prevLiked = item.likedByMe;
        const prevCount = item.likeCount;
        const nextLiked = !prevLiked;
        const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));
        onLikeChange?.(item.id, nextLiked, nextCount);
        try {
            if (nextLiked) {
                await likePost(item.id);
            } else {
                await unlikePost(item.id);
            }
        } catch (e) {
            onLikeChange?.(item.id, prevLiked, prevCount);
            Alert.alert("Erro", apiErrorMessage(e, "Não foi possível curtir"));
        } finally {
            setLiking(false);
        }
    };

    const confirmDelete = () => {
        const run = async () => {
            setDeleting(true);
            try {
                await deletePost(item.id);
                onDeleted?.(item.id);
            } catch (e) {
                Alert.alert("Erro", apiErrorMessage(e, "Não foi possível excluir"));
            } finally {
                setDeleting(false);
            }
        };

        if (Platform.OS === "web") {
            if (typeof window !== "undefined" && window.confirm("Excluir este post?")) {
                void run();
            }
            return;
        }

        Alert.alert("Excluir", "Excluir este post?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Excluir", style: "destructive", onPress: () => { void run(); } },
        ]);
    };

    const goAuthor = () => {
        if (item.usuario?.id != null) onPressAuthor?.(item.usuario.id);
    };

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                },
            ]}
        >
            <Pressable
                style={styles.headerRow}
                onPress={goAuthor}
                disabled={!onPressAuthor || item.usuario?.id == null}
                accessibilityRole="button"
                accessibilityLabel={`Perfil de ${item.usuario?.nome ?? "usuário"}`}
            >
                <Avatar
                    nome={item.usuario?.nome}
                    uri={item.usuario?.foto_url}
                    size="sm"
                />
                <View style={styles.headerText}>
                    <Text style={[styles.author, { color: colors.text }]}>
                        {item.usuario?.nome ?? "Usuário"}
                    </Text>
                    {when ? (
                        <Text style={[styles.date, { color: colors.textMuted }]}>{when}</Text>
                    ) : null}
                </View>
            </Pressable>

            <Text style={[styles.text, { color: colors.text }]}>{item.post}</Text>

            <View style={styles.actions}>
                <Pressable
                    onPress={toggleLike}
                    disabled={liking}
                    style={styles.actionBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                        item.likedByMe
                            ? `Descurtir. ${item.likeCount} curtidas`
                            : `Curtir. ${item.likeCount} curtidas`
                    }
                >
                    {liking ? (
                        <ActivityIndicator size="small" color={colors.like} />
                    ) : (
                        <Text
                            style={[
                                styles.actionLabel,
                                {
                                    color: item.likedByMe ? colors.like : colors.textMuted,
                                },
                            ]}
                        >
                            {item.likedByMe ? "♥" : "♡"} {item.likeCount}
                        </Text>
                    )}
                </Pressable>

                {isMine ? (
                    <Pressable
                        onPress={confirmDelete}
                        disabled={deleting}
                        style={styles.actionBtn}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Excluir post"
                    >
                        {deleting ? (
                            <ActivityIndicator size="small" color={colors.danger} />
                        ) : (
                            <Text style={[styles.deleteLabel, { color: colors.danger }]}>
                                Excluir
                            </Text>
                        )}
                    </Pressable>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 10,
    },
    headerText: { flex: 1, minWidth: 0 },
    author: { fontWeight: "700", fontSize: 15 },
    date: { marginTop: 2, fontSize: 12 },
    text: { fontSize: 16, lineHeight: 22 },
    actions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        marginTop: 12,
    },
    actionBtn: { minWidth: 44 },
    actionLabel: { fontSize: 15, fontWeight: "600" },
    deleteLabel: { fontSize: 14, fontWeight: "600" },
});
