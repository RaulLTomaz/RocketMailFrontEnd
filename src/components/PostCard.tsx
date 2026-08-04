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

    return (
        <View style={styles.card}>
            <Pressable
                onPress={() => item.usuario?.id != null && onPressAuthor?.(item.usuario.id)}
                disabled={!onPressAuthor || item.usuario?.id == null}
            >
                <Text style={styles.author}>{item.usuario?.nome ?? "Usuário"}</Text>
            </Pressable>
            {when ? <Text style={styles.date}>{when}</Text> : null}
            <Text style={styles.text}>{item.post}</Text>

            <View style={styles.actions}>
                <Pressable
                    onPress={toggleLike}
                    disabled={liking}
                    style={styles.actionBtn}
                    hitSlop={8}
                >
                    {liking ? (
                        <ActivityIndicator size="small" />
                    ) : (
                        <Text style={[styles.actionLabel, item.likedByMe && styles.liked]}>
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
                    >
                        {deleting ? (
                            <ActivityIndicator size="small" />
                        ) : (
                            <Text style={styles.deleteLabel}>Excluir</Text>
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
        borderColor: "#eee",
        borderRadius: 12,
        padding: 12,
        backgroundColor: "#fff",
    },
    author: { fontWeight: "bold", fontSize: 16, color: "#111" },
    date: { color: "#777", marginTop: 2, marginBottom: 8, fontSize: 12 },
    text: { fontSize: 16, lineHeight: 22, color: "#222" },
    actions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        marginTop: 12,
    },
    actionBtn: { minWidth: 44 },
    actionLabel: { fontSize: 15, color: "#555" },
    liked: { color: "#c00" },
    deleteLabel: { fontSize: 14, color: "#a33" },
});
