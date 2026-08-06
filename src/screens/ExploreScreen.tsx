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

export default function ExploreScreen() {
    const { user, signOut } = useAuth();
    const { colors } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    const [posts, setPosts] = useState<PostWithLikes[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const [searchHits, setSearchHits] = useState<SearchHitWithLikes[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const searchAbortRef = useRef<AbortController | null>(null);
    const isSearching = debouncedQuery.trim().length > 0;

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [query]);

    const fetchPage = useCallback(async (offset: number, append: boolean) => {
        const data = await listPosts({
            limit: PAGE_SIZE,
            offset,
            sort: "-data",
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
        } catch (e: unknown) {
            setHasMore(false);
            Alert.alert("Erro", apiErrorMessage(e, "Falha ao carregar posts"));
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
            const enriched: SearchHitWithLikes[] = [];
            for (const hit of hits) {
                const withLikes = await attachLikes(hit.posts ?? []);
                enriched.push({ usuario: hit.usuario, posts: withLikes });
            }
            if (!controller.signal.aborted) {
                setSearchHits(enriched);
            }
        } catch (e: any) {
            if (e?.name === "CanceledError" || e?.message === "canceled") return;
            const status = e?.response?.status;
            if (status === 404) {
                setSearchHits([]);
                setSearchError(
                    "Busca de usuários ainda não está disponível no servidor. Peça o deploy do endpoint GET /usuario/search."
                );
            } else {
                setSearchHits([]);
                setSearchError(apiErrorMessage(e, "Falha ao buscar usuários"));
            }
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
                setHasMore(true);
                await fetchPage(0, false);
            }
        } catch (e: unknown) {
            if (!isSearching) {
                setHasMore(false);
                Alert.alert("Erro", apiErrorMessage(e, "Falha ao atualizar"));
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
            setHasMore(false);
            Alert.alert("Erro", apiErrorMessage(e, "Falha ao carregar mais"));
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

    if (loading && !isSearching) {
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
                    <View style={styles.headerText}>
                        <Text style={[styles.title, { color: colors.text }]}>Procurar</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <ThemeToggle size="sm" />
                        <Button title="Sair" variant="ghost" onPress={handleSignOut} />
                    </View>
                </View>

                <View style={styles.searchWrap}>
                    <TextField
                        placeholder="Buscar usuários por nome…"
                        value={query}
                        onChangeText={setQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                        clearButtonMode="while-editing"
                        style={[
                            styles.searchInput,
                            {
                                borderColor: colors.border,
                                backgroundColor: colors.surface,
                            },
                        ]}
                    />
                    {query.length > 0 ? (
                        <Pressable
                            onPress={() => setQuery("")}
                            style={styles.clearBtn}
                            hitSlop={8}
                        >
                            <Text style={{ color: colors.accent, fontWeight: "600" }}>
                                Limpar
                            </Text>
                        </Pressable>
                    ) : null}
                </View>

                {isSearching ? (
                    searchLoading ? (
                        <View style={styles.loadingInline}>
                            <ActivityIndicator color={colors.accent} />
                        </View>
                    ) : (
                        <FlatList
                            style={styles.flex}
                            data={searchHits}
                            keyExtractor={(item) => String(item.usuario.id)}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    tintColor={colors.accent}
                                    colors={[colors.accent]}
                                />
                            }
                            contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 20 }}
                            ListHeaderComponent={
                                searchError ? (
                                    <Text
                                        style={[
                                            styles.searchMsg,
                                            { color: colors.danger },
                                        ]}
                                    >
                                        {searchError}
                                    </Text>
                                ) : null
                            }
                            ListEmptyComponent={
                                !searchError ? (
                                    <View style={{ padding: 24, alignItems: "center" }}>
                                        <Text style={{ color: colors.textMuted }}>
                                            Nenhum usuário encontrado para “{debouncedQuery}”.
                                        </Text>
                                    </View>
                                ) : null
                            }
                            renderItem={({ item }) => (
                                <View style={styles.hitBlock}>
                                    <Pressable
                                        style={[
                                            styles.userRow,
                                            {
                                                backgroundColor: colors.surface,
                                                borderColor: colors.border,
                                            },
                                        ]}
                                        onPress={() =>
                                            navigation.navigate("Profile", {
                                                userId: item.usuario.id,
                                            })
                                        }
                                    >
                                        <Avatar
                                            nome={item.usuario.nome}
                                            uri={item.usuario.foto_url}
                                            size="md"
                                        />
                                        <View style={{ flex: 1, minWidth: 0 }}>
                                            <Text
                                                style={[
                                                    styles.userName,
                                                    { color: colors.text },
                                                ]}
                                            >
                                                {item.usuario.nome}
                                            </Text>
                                            <Text
                                                style={{
                                                    color: colors.textMuted,
                                                    fontSize: 13,
                                                }}
                                                numberOfLines={1}
                                            >
                                                {item.usuario.email}
                                            </Text>
                                        </View>
                                        <Text
                                            style={{
                                                color: colors.accent,
                                                fontWeight: "600",
                                                fontSize: 13,
                                            }}
                                        >
                                            Ver perfil
                                        </Text>
                                    </Pressable>

                                    {item.posts.length === 0 ? (
                                        <Text
                                            style={[
                                                styles.noPosts,
                                                { color: colors.textMuted },
                                            ]}
                                        >
                                            Sem posts ainda.
                                        </Text>
                                    ) : (
                                        <View style={styles.postsCol}>
                                            {item.posts.map((p) => (
                                                <PostCard
                                                    key={p.id}
                                                    item={p}
                                                    currentUserId={user?.id}
                                                    onPressAuthor={(userId) =>
                                                        navigation.navigate("Profile", {
                                                            userId,
                                                        })
                                                    }
                                                    onDeleted={(id) => {
                                                        setSearchHits((prev) =>
                                                            prev.map((h) =>
                                                                h.usuario.id ===
                                                                item.usuario.id
                                                                    ? {
                                                                          ...h,
                                                                          posts: h.posts.filter(
                                                                              (x) =>
                                                                                  x.id !== id
                                                                          ),
                                                                      }
                                                                    : h
                                                            )
                                                        );
                                                    }}
                                                    onLikeChange={onLikeChange}
                                                />
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )}
                        />
                    )
                ) : (
                    <FlatList
                        style={styles.flex}
                        data={posts}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={({ item }) => (
                            <PostCard
                                item={item}
                                currentUserId={user?.id}
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
                                    Nenhum post por aqui.
                                </Text>
                            </View>
                        }
                    />
                )}
            </ContentColumn>
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    loading: { justifyContent: "center", alignItems: "center" },
    loadingInline: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    headerText: { flex: 1, minWidth: 0 },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    title: { fontSize: 24, fontWeight: "800" },
    searchWrap: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        gap: 8,
    },
    searchInput: {
        borderRadius: 14,
    },
    clearBtn: {
        alignSelf: "flex-end",
        paddingVertical: 4,
    },
    searchMsg: {
        fontSize: 14,
        marginBottom: 12,
        lineHeight: 20,
    },
    hitBlock: {
        gap: 10,
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: "700",
    },
    noPosts: {
        fontSize: 13,
        paddingHorizontal: 4,
    },
    postsCol: {
        gap: 10,
    },
});
