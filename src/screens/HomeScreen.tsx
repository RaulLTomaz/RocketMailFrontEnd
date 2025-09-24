import React, { useCallback, useEffect, useState } from "react";
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
import { useAuth } from "../context/AuthContext";
import { createPost, listFeed, Post } from "../api/posts";

export default function HomeScreen() {
    const { signOut, user } = useAuth();

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const [novoPost, setNovoPost] = useState("");
    const [creating, setCreating] = useState(false);

    const PAGE_SIZE = 20;

    const fetchPage = useCallback(
        async (offset: number, append: boolean) => {
            const data = await listFeed({ limit: PAGE_SIZE, offset });
            if (data.length < PAGE_SIZE) setHasMore(false);
            setPosts((prev) => (append ? [...prev, ...data] : data));
        },
        []
    );

    const initialLoad = useCallback(async () => {
        try {
            setLoading(true);
            setHasMore(true);
            await fetchPage(0, false);
        } catch (e: any) {
            // Se não autenticado, desloga e sai
            if (e?.response?.status === 401) {
                await signOut();
                return;
            }
            // Evita a “metralhadora” de onEndReached
            setHasMore(false);
            Alert.alert("Erro", e?.response?.data?.detail || e?.message || "Falha ao carregar feed");
        } finally {
            setLoading(false);
        }
    }, [fetchPage, signOut]);

    useEffect(() => {
        initialLoad();
    }, [initialLoad]);

    const onRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            setHasMore(true);
            await fetchPage(0, false);
        } catch (e: any) {
            if (e?.response?.status === 401) {
                await signOut();
                return;
            }
            setHasMore(false);
            Alert.alert("Erro", e?.response?.data?.detail || e?.message || "Falha ao atualizar feed");
        } finally {
            setRefreshing(false);
        }
    }, [fetchPage, signOut]);

    const onEndReached = useCallback(async () => {
        // Guardas contra loop:
        if (loadingMore || !hasMore || loading) return;
        // Não tente paginar se nem a primeira página carregou
        if (posts.length === 0) return;

        try {
            setLoadingMore(true);
            await fetchPage(posts.length, true);
        } catch (e: any) {
            if (e?.response?.status === 401) {
                await signOut();
                return;
            }
            setHasMore(false);
            Alert.alert("Erro", e?.response?.data?.detail || e?.message || "Falha ao carregar mais posts");
        } finally {
            setLoadingMore(false);
        }
    }, [fetchPage, hasMore, loading, loadingMore, posts.length, signOut]);

    const handleCreatePost = useCallback(async () => {
        const conteudo = (novoPost || "").trim();
        if (!conteudo) return;
        try {
            setCreating(true);
            const created = await createPost({ conteudo });
            setPosts((prev) => [created, ...prev]);
            setNovoPost("");
        } catch (e: any) {
            if (e?.response?.status === 401) {
                await signOut();
                return;
            }
            Alert.alert("Erro", e?.response?.data?.detail || e?.message || "Não foi possível publicar");
        } finally {
            setCreating(false);
        }
    }, [novoPost, signOut]);

    const handleSignOut = useCallback(async () => {
        if (Platform.OS === "web") {
            const ok = typeof window !== "undefined" ? window.confirm("Deseja realmente sair da conta?") : true;
            if (ok) {
                await signOut();
            }
            return;
        }

        Alert.alert("Sair", "Deseja realmente sair da conta?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Sair", style: "destructive", onPress: async () => { await signOut(); } },
        ]);
    }, [signOut]);

    const renderItem = ({ item }: { item: Post }) => {
        const authorName = item.usuario?.nome ?? `#${item.usuario_id}`;
        let when: string | undefined;
        if (item.criado_em) {
            try {
                const d = new Date(item.criado_em);
                when = d.toLocaleString();
            } catch {}
        }

        return (
            <View style={styles.postCard}>
                <Text style={styles.postAuthor}>{authorName}</Text>
                {when ? <Text style={styles.postDate}>{when}</Text> : null}
                <Text style={styles.postText}>{item.conteudo}</Text>
            </View>
        );
    };

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
                    {user ? <Text style={styles.subtitle}>Olá, {user.nome}</Text> : null}
                </View>
                <Button title="Sair" onPress={handleSignOut} />
            </View>

            <View style={styles.composer}>
                <TextInput
                    style={styles.input}
                    placeholder="O que está acontecendo?"
                    value={novoPost}
                    editable={!creating}
                    onChangeText={setNovoPost}
                    multiline
                />
                <Button title={creating ? "Publicando..." : "Postar"} onPress={handleCreatePost} disabled={creating} />
            </View>

            <FlatList
                data={posts}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
                        <Text>Nenhum post ainda. Seja o primeiro! ✨</Text>
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
    input: {
        minHeight: 60,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        textAlignVertical: "top",
        marginBottom: 8,
    },
    postCard: { borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12 },
    postAuthor: { fontWeight: "bold", fontSize: 16 },
    postDate: { color: "#777", marginTop: 2, marginBottom: 8, fontSize: 12 },
    postText: { fontSize: 16, lineHeight: 22 },
});
