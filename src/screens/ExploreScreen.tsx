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
    Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { listPosts, PostWithLikes } from "../api/posts";
import { attachLikes } from "../api/attachLikes";
import { searchUsers, UsuarioSearchHit, UsuarioOut } from "../api/users";
import type { RootStackParamList } from "../types/navigation";
import { apiErrorMessage } from "../utils/apiError";
import PostCard from "../components/PostCard";
import Avatar from "../components/Avatar";
import Screen from "../components/ui/Screen";
import ContentColumn from "../components/ui/ContentColumn";
import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ThemeToggle";

const PAGE_SIZE = 20;
/** Evita uma request por tecla digitada na busca. */
const SEARCH_DEBOUNCE_MS = 400;

type SearchHitWithLikes = {
    usuario: UsuarioOut;
    posts: PostWithLikes[];
};

function isCanceled(e: unknown): boolean {
    const err = e as { name?: string; message?: string };
    return err?.name === "CanceledError" || err?.message === "canceled";
}

export default function ExploreScreen() {
    const { user, signOut } = useAuth();
    const { colors } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    const [posts, setPosts] = useState<PostWithLikes[]>([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const [searchHits, setSearchHits] = useState<SearchHitWithLikes[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const feedAbortRef = useRef<AbortController | null>(null);
    const searchAbortRef = useRef<AbortController | null>(null);
    const isSearching = debouncedQuery.trim().length > 0;

    const nextFeedSignal = () => {
        feedAbortRef.current?.abort();
        const c = new AbortController();
        feedAbortRef.current = c;
        return c.signal;
    };

    useEffect(() => {
        return () => {
            feedAbortRef.current?.abort();
            searchAbortRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [query]);

    const fetchPage = useCallback(async (offset: number, append: boolean) => {
        const data = await listPosts({
            limit: PAGE_SIZE,
            offset,
            sort: "-data",
            signal: nextFeedSignal(),
        });
        const withLikes = await attachLikes(data);
        setHasMore(data.length >= PAGE_SIZE);
        setPosts((prev) => (append ? [...prev, ...withLikes] : withLikes));
    }, []);

    const initialLoad = useCallback(async () => {
        try {
            setLoading(true);
            setListError(null);
            setHasMore(true);
            await fetchPage(0, false);
        } catch (e: unknown) {
            if (isCanceled(e)) return;
            setHasMore(false);
            setListError(apiErrorMessage(e, "Falha ao carregar posts"));
        } finally {
            setLoading(false);
        }
    }, [fetchPage]);

    useEffect(() => {
        initialLoad();
    }, [initialLoad]);

    const runSearch = useCallback(async (q: string) => {
        searchAbortRef.current?.abort();
        const controller = new AbortController();
        searchAbortRef.current = controller;

        setSearchLoading(true);
        setSearchError(null);
        try {
            const hits: UsuarioSearchHit[] = await searchUsers({
                q,
                limit: 20,
                postsPerUser: 5,
                signal: controller.signal,
            });
            const allPosts = hits.flatMap((h) => h.posts ?? []);
            const withLikes = await attachLikes(allPosts);
            const byId = new Map(withLikes.map((p) => [p.id, p]));
            const enriched: SearchHitWithLikes[] = hits.map((hit) => ({
                usuario: hit.usuario,
                posts: (hit.posts ?? []).map(
                    (p) =>
                        byId.get(p.id) ?? {
                            ...p,
                            likeCount: 0,
                            likedByMe: false,
                        }
                ),
            }));
            if (!controller.signal.aborted) {
                setSearchHits(enriched);
            }
        } catch (e: unknown) {
            if (isCanceled(e)) return;
            setSearchHits([]);
            setSearchError(apiErrorMessage(e, "Falha ao buscar usuários"));
        } finally {
            if (!controller.signal.aborted) setSearchLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isSearching) {
            searchAbortRef.current?.abort();
            setSearchHits([]);
            setSearchError(null);
            setSearchLoading(false);
            return;
        }
        void runSearch(debouncedQuery);
    }, [debouncedQuery, isSearching, runSearch]);

    const onRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            if (isSearching) {
                await runSearch(debouncedQuery);
            } else {
                setListError(null);
                setHasMore(true);
                await fetchPage(0, false);
            }
        } catch (e: unknown) {
            if (!isSearching && !isCanceled(e)) {
                setHasMore(false);
                setListError(apiErrorMessage(e, "Falha ao atualizar"));
            }
        } finally {
            setRefreshing(false);
        }
    }, [fetchPage, isSearching, debouncedQuery, runSearch]);

    const onEndReached = useCallback(async () => {
        if (isSearching) return;
        if (loadingMore || !hasMore || loading || posts.length === 0) return;
        try {
            setLoadingMore(true);
            await fetchPage(posts.length, true);
        } catch (e: unknown) {
            if (isCanceled(e)) return;
            setHasMore(false);
            setListError(apiErrorMessage(e, "Falha ao carregar mais"));
        } finally {
            setLoadingMore(false);
        }
    }, [fetchPage, hasMore, loading, loadingMore, posts.length, isSearching]);

    const onLikeChange = useCallback(
        (postId: number, likedByMe: boolean, likeCount: number) => {
            setPosts((prev) =>
                prev.map((p) => (p.id === postId ? { ...p, likedByMe, likeCount } : p))
            );
            setSearchHits((prev) =>
                prev.map((hit) => ({
                    ...hit,
                    posts: hit.posts.map((p) =>
                        p.id === postId ? { ...p, likedByMe, likeCount } : p
                    ),
                }))
            );
        },
        []
    );

    const handleSignOut = useCallback(async () => {
        const doIt = async () => {
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

    if (!user || (loading && !isSearching)) {
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
                    <Text style={[styles.title, { color: colors.text }]}>Procurar</Text>
                    <View style={styles.headerActions}>
                        <ThemeToggle size="sm" />
                        <Button title="Sair" variant="ghost" onPress={handleSignOut} />
                    </View>
                </View>

                <View style={styles.searchRow}>
                    <TextField
                        style={styles.searchInput}
                        placeholder="Buscar usuários por nome…"
                        accessibilityLabel="Buscar usuários por nome"
                        value={query}
                        onChangeText={setQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {searchLoading ? (
                        <ActivityIndicator color={colors.accent} style={{ marginLeft: 8 }} />
                    ) : null}
                </View>

                {isSearching ? (
                    <>
                        {searchError ? (
                            <Text style={[styles.inlineError, { color: colors.danger }]}>
                                {searchError}
                            </Text>
                        ) : null}
                        <FlatList
                            style={styles.flex}
                            data={searchHits}
                            keyExtractor={(item) => String(item.usuario.id)}
                            contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    tintColor={colors.accent}
                                    colors={[colors.accent]}
                                />
                            }
                            ListEmptyComponent={
                                !searchLoading ? (
                                    <View style={{ padding: 24, alignItems: "center" }}>
                                        <Text style={{ color: colors.textMuted }}>
                                            {searchError
                                                ? "Não foi possível buscar agora."
                                                : "Nenhum usuário encontrado."}
                                        </Text>
                                    </View>
                                ) : null
                            }
                            renderItem={({ item }) => (
                                <View
                                    style={[
                                        styles.hitCard,
                                        {
                                            borderColor: colors.border,
                                            backgroundColor: colors.surface,
                                        },
                                    ]}
                                >
                                    <Pressable
                                        style={styles.hitHeader}
                                        onPress={() =>
                                            navigation.navigate("Profile", {
                                                userId: item.usuario.id,
                                            })
                                        }
                                        accessibilityRole="button"
                                        accessibilityLabel={`Abrir perfil de ${item.usuario.nome}`}
                                    >
                                        <Avatar
                                            nome={item.usuario.nome}
                                            uri={item.usuario.foto_url}
                                            size="md"
                                        />
                                        <View style={{ flex: 1, minWidth: 0 }}>
                                            <Text
                                                style={[styles.hitName, { color: colors.text }]}
                                            >
                                                {item.usuario.nome}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.hitEmail,
                                                    { color: colors.textMuted },
                                                ]}
                                            >
                                                {item.usuario.email}
                                            </Text>
                                        </View>
                                    </Pressable>
                                    {item.posts.map((p) => (
                                        <View key={p.id} style={{ marginTop: 10 }}>
                                            <PostCard
                                                item={p}
                                                currentUserId={user.id}
                                                onPressAuthor={(userId) =>
                                                    navigation.navigate("Profile", { userId })
                                                }
                                                onLikeChange={onLikeChange}
                                            />
                                        </View>
                                    ))}
                                </View>
                            )}
                        />
                    </>
                ) : (
                    <>
                        {listError ? (
                            <View style={styles.errorBanner}>
                                <Text style={[styles.inlineError, { color: colors.danger }]}>
                                    {listError}
                                </Text>
                                <Button
                                    title="Tentar novamente"
                                    variant="ghost"
                                    onPress={() => void initialLoad()}
                                />
                            </View>
                        ) : null}
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
                                        {listError
                                            ? "Não foi possível carregar os posts."
                                            : "Nenhum post para explorar."}
                                    </Text>
                                </View>
                            }
                        />
                    </>
                )}
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
    title: { fontSize: 22, fontWeight: "800" },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 4,
    },
    searchInput: { flex: 1 },
    inlineError: {
        fontSize: 14,
        paddingHorizontal: 16,
        marginBottom: 4,
    },
    errorBanner: {
        paddingHorizontal: 16,
        paddingBottom: 4,
        gap: 4,
        alignItems: "flex-start",
    },
    hitCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
    },
    hitHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    hitName: { fontSize: 16, fontWeight: "700" },
    hitEmail: { fontSize: 13, marginTop: 2 },
});
