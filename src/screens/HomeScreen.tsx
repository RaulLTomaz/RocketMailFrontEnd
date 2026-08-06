import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Platform,
    Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { createPost, listFeed, PostWithLikes } from "../api/posts";
import { attachLikes } from "../api/attachLikes";
import type { RootStackParamList } from "../types/navigation";
import { apiErrorMessage } from "../utils/apiError";
import PostCard from "../components/PostCard";
import Screen from "../components/ui/Screen";
import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ThemeToggle";
import ContentColumn from "../components/ui/ContentColumn";

const PAGE_SIZE = 20;
const MAX_LEN = 280;

export default function HomeScreen() {
    const { signOut, user } = useAuth();
    const { colors } = useTheme();
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

    if (!user || loading) {
        return (
            <Screen style={styles.loading}>
                <ActivityIndicator color={colors.accent} />
            </Screen>
        );
    }

    return (
        <Screen>
            <ContentColumn style={styles.flex}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Image
                            source={require("../images/FAVICON.png")}
                            style={styles.headerLogo}
                            resizeMode="contain"
                            accessibilityLabel="RocketMail"
                        />
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={[styles.title, { color: colors.text }]}>
                                Olá, {user.nome}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.headerActions}>
                        <ThemeToggle size="sm" />
                        <Button title="Sair" variant="ghost" onPress={handleSignOut} />
                    </View>
                </View>

                <View
                    style={[
                        styles.composer,
                        {
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                        },
                    ]}
                >
                    <TextField
                        style={styles.composerInput}
                        placeholder="O que está acontecendo?"
                        value={novoPost}
                        editable={!creating}
                        onChangeText={(t) => setNovoPost(t.slice(0, MAX_LEN))}
                        multiline
                        maxLength={MAX_LEN}
                    />
                    <View style={styles.composerFooter}>
                        <Text style={[styles.counter, { color: colors.textMuted }]}>
                            {novoPost.length}/{MAX_LEN}
                        </Text>
                        <Button
                            title={creating ? "Publicando..." : "Postar"}
                            onPress={handleCreatePost}
                            disabled={creating || !novoPost.trim()}
                            loading={creating}
                        />
                    </View>
                </View>

                <FlatList
                    style={styles.flex}
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
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.accent}
                            colors={[colors.accent]}
                        />
                    }
                    onEndReachedThreshold={0.5}
                    onEndReached={onEndReached}
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={{ paddingVertical: 16 }}>
                                <ActivityIndicator color={colors.accent} />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={{ padding: 24, alignItems: "center" }}>
                            <Text style={{ color: colors.textMuted }}>
                                Nenhum post ainda. Seja o primeiro!
                            </Text>
                        </View>
                    }
                />
            </ContentColumn>
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    loading: { justifyContent: "center", alignItems: "center" },
    header: {
        paddingTop: 8,
        paddingHorizontal: 16,
        paddingBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    headerLeft: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        minWidth: 0,
    },
    headerLogo: { width: 36, height: 36 },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    title: { fontSize: 22, fontWeight: "800" },
    composer: {
        gap: 8,
        marginTop: 8,
        marginHorizontal: 16,
        marginBottom: 4,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 14,
    },
    composerInput: {
        minHeight: 72,
        textAlignVertical: "top",
    },
    composerFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    counter: { fontSize: 13 },
});
