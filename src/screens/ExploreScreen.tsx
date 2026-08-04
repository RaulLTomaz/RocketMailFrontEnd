import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { listPosts, PostWithLikes } from "../api/posts";
import { attachLikes } from "../api/attachLikes";
import type { RootStackParamList } from "../types/navigation";
import { apiErrorMessage } from "../utils/apiError";
import PostCard from "../components/PostCard";

const PAGE_SIZE = 20;

export default function ExploreScreen() {
    const { user } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [posts, setPosts] = useState<PostWithLikes[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

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

    const onRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            setHasMore(true);
            await fetchPage(0, false);
        } catch (e: unknown) {
            setHasMore(false);
            Alert.alert("Erro", apiErrorMessage(e, "Falha ao atualizar"));
        } finally {
            setRefreshing(false);
        }
    }, [fetchPage]);

    const onEndReached = useCallback(async () => {
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
    }, [fetchPage, hasMore, loading, loadingMore, posts.length]);

    const onLikeChange = useCallback(
        (postId: number, likedByMe: boolean, likeCount: number) => {
            setPosts((prev) =>
                prev.map((p) => (p.id === postId ? { ...p, likedByMe, likeCount } : p))
            );
        },
        []
    );

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
                <Text style={styles.title}>Explorar</Text>
                <Text style={styles.subtitle}>Todos os posts</Text>
            </View>

            <FlatList
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
                        <Text>Nenhum post por aqui.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    loading: { flex: 1, justifyContent: "center" },
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    title: { fontSize: 24, fontWeight: "bold" },
    subtitle: { marginTop: 4, color: "#666" },
});
