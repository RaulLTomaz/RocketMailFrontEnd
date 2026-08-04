import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Button,
    FlatList,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { createPost, listFeed, PostWithLikes } from "../api/posts";
import { attachLikes } from "../api/attachLikes";
import type { RootStackParamList } from "../types/navigation";
import { apiErrorMessage } from "../utils/apiError";
import PostCard from "../components/PostCard";

const PAGE_SIZE = 20;
const MAX_LEN = 280;

export default function HomeScreen() {
    const { signOut, user } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [posts, setPosts] = useState<PostWithLikes[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const [novoPost, setNovoPost] = useState("");
    const [creating, setCreating] = useState(false);

    const abortRef = useRef<AbortController | null>(null);
    const nextSignal = () => {
        abortRef.current?.abort();
        const c = new AbortController();
        abortRef.current = c;
        return c.signal;
    };

    useEffect(() => {
        return () => {
            abortRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (!user) abortRef.current?.abort();
    }, [user]);

    const fetchPage = useCallback(async (offset: number, append: boolean) => {
        const data = await listFeed({
            limit: PAGE_SIZE,
            offset,
            signal: nextSignal(),
        });
        const withLikes = await attachLikes(data);
        setHasMore(data.length >= PAGE_SIZE);
        setPosts((prev) => (append ? [...prev, ...withLikes] : withLikes));
    }, []);

    const initialLoad = useCallback(async () => {
        try {
            setLoading(true);
            setHasMore(true);
            await fetchPage(0, false);
        } catch (e: any) {
            if (e?.name === "CanceledError" || e?.message === "canceled") return;
            if (e?.response?.status === 401) return;
            setHasMore(false);
            Alert.alert("Erro", apiErrorMessage(e, "Falha ao carregar feed"));
        } finally {
            setLoading(false);
        }
    }, [fetchPage]);

    useEffect(() => {
        if (user) initialLoad();
    }, [initialLoad, user]);

    const onRefresh = useCallback(async () => {
        if (!user) return;
        try {
            setRefreshing(true);
            setHasMore(true);
            await fetchPage(0, false);
        } catch (e: any) {
            if (e?.name === "CanceledError" || e?.message === "canceled") return;
            if (e?.response?.status === 401) return;
            setHasMore(false);
            Alert.alert("Erro", apiErrorMessage(e, "Falha ao atualizar feed"));
        } finally {
            setRefreshing(false);
        }
    }, [fetchPage, user]);

    const onEndReached = useCallback(async () => {
        if (!user || loadingMore || !hasMore || loading || posts.length === 0) return;
        try {
            setLoadingMore(true);
            await fetchPage(posts.length, true);
        } catch (e: any) {
            if (e?.name === "CanceledError" || e?.message === "canceled") return;
            if (e?.response?.status === 401) return;
            setHasMore(false);
            Alert.alert("Erro", apiErrorMessage(e, "Falha ao carregar mais posts"));
        } finally {
            setLoadingMore(false);
        }
    }, [fetchPage, hasMore, loading, loadingMore, posts.length, user]);

    const handleCreatePost = useCallback(async () => {
        if (!user) return;
        const texto = (novoPost || "").trim();
        if (!texto) return;
        if (texto.length > MAX_LEN) {
            Alert.alert("Atenção", `O post pode ter no máximo ${MAX_LEN} caracteres.`);
            return;
        }
        try {
            setCreating(true);
            const created = await createPost({ post: texto });
            const [withLikes] = await attachLikes([created]);
            setPosts((prev) => [withLikes, ...prev]);
            setNovoPost("");
        } catch (e: any) {
            if (e?.name === "CanceledError" || e?.message === "canceled") return;
            if (e?.response?.status === 401) return;
            Alert.alert("Erro", apiErrorMessage(e, "Não foi possível publicar"));
        } finally {
            setCreating(false);
        }
    }, [novoPost, user]);

    const handleSignOut = useCallback(async () => {
        const doIt = async () => {
            abortRef.current?.abort();
            try {
                await signOut();
            } catch {}
        };

        if (Platform.OS === "web") {
            const ok =
                typeof window !== "undefined"
                    ? window.confirm("Deseja realmente sair da conta?")
                    : true;
            if (ok) await doIt();
            return;
        }

        Alert.alert("Sair", "Deseja realmente sair da conta?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Sair", style: "destructive", onPress: () => { void doIt(); } },
        ]);
    }, [signOut]);

    const onLikeChange = useCallback(
        (postId: number, likedByMe: boolean, likeCount: number) => {
            setPosts((prev) =>
                prev.map((p) => (p.id === postId ? { ...p, likedByMe, likeCount } : p))
            );
        },
        []
    );

    if (!user) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator />
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Feed</Text>
                    <Text style={styles.subtitle}>Olá, {user.nome}</Text>
                </View>
                <Button title="Sair" onPress={handleSignOut} />
            </View>

            <View style={styles.composer}>
                <TextInput
                    style={styles.input}
                    placeholder="O que está acontecendo?"
                    value={novoPost}
                    editable={!creating}
                    onChangeText={(t) => setNovoPost(t.slice(0, MAX_LEN))}
                    multiline
                    maxLength={MAX_LEN}
                />
                <View style={styles.composerFooter}>
                    <Text style={styles.counter}>
                        {novoPost.length}/{MAX_LEN}
                    </Text>
                    <Button
                        title={creating ? "Publicando..." : "Postar"}
                        onPress={handleCreatePost}
                        disabled={creating || !novoPost.trim()}
                    />
                </View>
            </View>

            <FlatList
                data={posts}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <PostCard
                        item={item}
                        currentUserId={user.id}
                        onPressAuthor={(userId) =>
                            navigation.navigate("Profile", { userId })
                        }
                        onDeleted={(id) =>
                            setPosts((prev) => prev.filter((p) => p.id !== id))
                        }
                        onLikeChange={onLikeChange}
                    />
                )}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                onEndReachedThreshold={0.5}
                onEndReached={onEndReached}
                ListFooterComponent={
                    loadingMore ? (
                        <View style={{ paddingVertical: 16 }}>
                            <ActivityIndicator />
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={{ padding: 24, alignItems: "center" }}>
                        <Text>Nenhum post ainda. Seja o primeiro!</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    loading: { flex: 1, justifyContent: "center" },
    header: {
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    title: { fontSize: 24, fontWeight: "bold" },
    subtitle: { marginTop: 4, color: "#666" },
    composer: { gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
    composerFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    counter: { color: "#888", fontSize: 13 },
    input: {
        minHeight: 60,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        textAlignVertical: "top",
    },
});
