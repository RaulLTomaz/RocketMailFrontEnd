import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { listPosts, PostWithLikes } from "../api/posts";
import { attachLikes } from "../api/attachLikes";
import type { RootStackParamList } from "../types/navigation";
import { apiErrorMessage } from "../utils/apiError";
import PostCard from "../components/PostCard";
import Screen from "../components/ui/Screen";
import ContentColumn from "../components/ui/ContentColumn";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ThemeToggle";

const PAGE_SIZE = 20;

export default function ExploreScreen() {
    const { user, signOut } = useAuth();
    const { colors } = useTheme();
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

    if (loading) {
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
                        <Text style={[styles.title, { color: colors.text }]}>Explorar</Text>
                        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                            Todos os posts
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        <ThemeToggle size="sm" />
                        <Button title="Sair" variant="ghost" onPress={handleSignOut} />
                    </View>
                </View>

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
            </ContentColumn>
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    loading: { justifyContent: "center", alignItems: "center" },
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
    subtitle: { marginTop: 4, fontSize: 14 },
});
