import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import {
    getUser,
    getUserStats,
    getUserPosts,
    UsuarioOut,
    Post as UPost,
} from "../api/users";
import type { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

const PAGE_SIZE = 20;

export default function ProfileScreen({ route }: Props) {
    const { user: me } = useAuth();

    const viewingUserId = useMemo<number | null>(() => {
        if (route.params?.userId != null) {
            return route.params.userId;
        }
        return me ? me.id : null;
    }, [route.params?.userId, me]);

    const [user, setUser] = useState<UsuarioOut | null>(null);
    const [stats, setStats] = useState<{
        posts: number;
        seguidores: number;
        seguindo: number;
    } | null>(null);
    const [posts, setPosts] = useState<UPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const isMe = me && viewingUserId === me.id;

    const loadHeader = useCallback(async (id: number) => {
        const [u, s] = await Promise.all([
            getUser(id),
            getUserStats(id),
        ]);
        setUser(u);
        setStats(s.stats);
    }, []);

    const loadPage = useCallback(
        async (id: number, offset: number, append: boolean) => {
            const data = await getUserPosts(id, {
                limit: PAGE_SIZE,
                offset,
            });
            if (data.length < PAGE_SIZE) {
                setHasMore(false);
            }
            setPosts((prev) => (append ? [...prev, ...data] : data));
        },
        []
    );

    const initialLoad = useCallback(async () => {
        if (!viewingUserId) return;

        try {
            setLoading(true);
            setHasMore(true);
            await Promise.all([
                loadHeader(viewingUserId),
                loadPage(viewingUserId, 0, false),
            ]);
        } catch (e: any) {
            Alert.alert(
                "Erro",
                e?.response?.data?.detail ||
                    e?.message ||
                    "Falha ao carregar perfil"
            );
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [viewingUserId, loadHeader, loadPage]);

    useEffect(() => {
        initialLoad();
    }, [initialLoad]);

    const onRefresh = useCallback(async () => {
        if (!viewingUserId) return;

        try {
            setRefreshing(true);
            setHasMore(true);
            await Promise.all([
                loadHeader(viewingUserId),
                loadPage(viewingUserId, 0, false),
            ]);
        } catch (e: any) {
            Alert.alert(
                "Erro",
                e?.response?.data?.detail ||
                    e?.message ||
                    "Falha ao atualizar"
            );
            setHasMore(false);
        } finally {
            setRefreshing(false);
        }
    }, [viewingUserId, loadHeader, loadPage]);

    const onEndReached = useCallback(async () => {
        if (loadingMore || !hasMore || loading) return;
        if (!viewingUserId) return;
        if (posts.length === 0) return;

        try {
            setLoadingMore(true);
            await loadPage(viewingUserId, posts.length, true);
        } catch (e: any) {
            Alert.alert(
                "Erro",
                e?.response?.data?.detail ||
                    e?.message ||
                    "Falha ao carregar mais posts"
            );
            setHasMore(false);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore, loading, viewingUserId, posts.length, loadPage]);

    const renderItem = ({ item }: { item: UPost }) => {
        let when: string | undefined;
        if (item.criado_em) {
            try {
                when = new Date(item.criado_em).toLocaleString();
            } catch {}
        }

        return (
            <View style={styles.postCard}>
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

    if (!user) {
        return (
            <View style={styles.loading}>
                <Text>Usuário não encontrado.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.name}>{user.nome}</Text>
                <Text style={styles.email}>{user.email}</Text>

                {stats ? (
                    <View style={styles.counters}>
                        <Text style={styles.counter}>{stats.posts} posts</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.counter}>
                            {stats.seguidores} seguidores
                        </Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.counter}>
                            {stats.seguindo} seguindo
                        </Text>
                    </View>
                ) : null}

                {isMe ? <Text style={styles.badge}>Seu perfil</Text> : null}
            </View>

            <FlatList
                data={posts}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
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
                        <Text>Sem posts por aqui.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 4 },
    name: { fontSize: 22, fontWeight: "700" },
    email: { color: "#666" },
    counters: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
    counter: { color: "#333" },
    dot: { color: "#aaa" },
    badge: {
        marginTop: 6,
        alignSelf: "flex-start",
        backgroundColor: "#eef",
        color: "#224",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        fontSize: 12,
        overflow: "hidden",
    },
    postCard: { borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12 },
    postDate: { color: "#777", marginBottom: 8, fontSize: 12 },
    postText: { fontSize: 16, lineHeight: 22 },
});
