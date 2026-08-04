import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Alert,
    Button,
    TextInput,
    Platform,
    Modal,
    Pressable,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import {
    getUser,
    getUserStats,
    getUserPosts,
    updateMe,
    deleteMe,
    uploadFoto,
    deleteFoto,
    UsuarioOut,
} from "../api/users";
import type { PostWithLikes } from "../api/posts";
import { attachLikes } from "../api/attachLikes";
import type { RootStackParamList } from "../types/navigation";
import { apiErrorMessage } from "../utils/apiError";
import PostCard from "../components/PostCard";
import Avatar from "../components/Avatar";
import PhotoViewer from "../components/PhotoViewer";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

const PAGE_SIZE = 20;

export default function ProfileScreen({ route }: Props) {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { user: me, signOut, setUser, isFollowing, follow, unfollow } = useAuth();

    const viewingUserId = useMemo<number | null>(() => {
        if (route.params?.userId != null) return route.params.userId;
        return me ? me.id : null;
    }, [route.params?.userId, me]);

    const [user, setProfileUser] = useState<UsuarioOut | null>(null);
    const [stats, setStats] = useState<{
        posts: number;
        seguidores: number;
        seguindo: number;
    } | null>(null);
    const [posts, setPosts] = useState<PostWithLikes[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [followBusy, setFollowBusy] = useState(false);
    const [fotoBusy, setFotoBusy] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);

    const [editOpen, setEditOpen] = useState(false);
    const [editNome, setEditNome] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editSenha, setEditSenha] = useState("");
    const [saving, setSaving] = useState(false);

    const isMe = !!(me && viewingUserId === me.id);
    const following = viewingUserId != null ? isFollowing(viewingUserId) : false;
    const hasPhoto = !!user?.foto_url;

    const applyUserUpdate = useCallback(
        (updated: UsuarioOut) => {
            setProfileUser(updated);
            if (isMe) setUser(updated);
        },
        [isMe, setUser]
    );

    const loadHeader = useCallback(async (id: number) => {
        const [u, s] = await Promise.all([getUser(id), getUserStats(id)]);
        setProfileUser(u);
        setStats(s.stats);
    }, []);

    const loadPage = useCallback(async (id: number, offset: number, append: boolean) => {
        const data = await getUserPosts(id, { limit: PAGE_SIZE, offset });
        const withLikes = await attachLikes(data);
        setHasMore(data.length >= PAGE_SIZE);
        setPosts((prev) => (append ? [...prev, ...withLikes] : withLikes));
    }, []);

    const initialLoad = useCallback(async () => {
        if (!viewingUserId) return;
        try {
            setLoading(true);
            setHasMore(true);
            await Promise.all([
                loadHeader(viewingUserId),
                loadPage(viewingUserId, 0, false),
            ]);
        } catch (e: unknown) {
            Alert.alert("Erro", apiErrorMessage(e, "Falha ao carregar perfil"));
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
        } catch (e: unknown) {
            Alert.alert("Erro", apiErrorMessage(e, "Falha ao atualizar"));
            setHasMore(false);
        } finally {
            setRefreshing(false);
        }
    }, [viewingUserId, loadHeader, loadPage]);

    const onEndReached = useCallback(async () => {
        if (loadingMore || !hasMore || loading || !viewingUserId || posts.length === 0) {
            return;
        }
        try {
            setLoadingMore(true);
            await loadPage(viewingUserId, posts.length, true);
        } catch (e: unknown) {
            Alert.alert("Erro", apiErrorMessage(e, "Falha ao carregar mais posts"));
            setHasMore(false);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore, loading, viewingUserId, posts.length, loadPage]);

    const onLikeChange = useCallback(
        (postId: number, likedByMe: boolean, likeCount: number) => {
            setPosts((prev) =>
                prev.map((p) => (p.id === postId ? { ...p, likedByMe, likeCount } : p))
            );
        },
        []
    );

    const toggleFollow = async () => {
        if (!viewingUserId || followBusy) return;
        setFollowBusy(true);
        try {
            if (following) {
                await unfollow(viewingUserId);
                setStats((s) =>
                    s ? { ...s, seguidores: Math.max(0, s.seguidores - 1) } : s
                );
            } else {
                await follow(viewingUserId);
                setStats((s) => (s ? { ...s, seguidores: s.seguidores + 1 } : s));
            }
        } catch (e: unknown) {
            Alert.alert("Erro", apiErrorMessage(e, "Não foi possível atualizar"));
        } finally {
            setFollowBusy(false);
        }
    };

    const pickAndUploadFoto = async () => {
        if (!isMe || fotoBusy) return;

        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert(
                "Permissão",
                "Precisamos de acesso às fotos para definir a foto de perfil."
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
        });

        if (result.canceled || !result.assets?.[0]) return;

        const asset = result.assets[0];
        setFotoBusy(true);
        try {
            const updated = await uploadFoto({
                uri: asset.uri,
                type: asset.mimeType || undefined,
                name: asset.fileName || undefined,
            });
            applyUserUpdate(updated);
            // atualiza avatares nos posts locais se for o autor
            setPosts((prev) =>
                prev.map((p) =>
                    p.usuario?.id === updated.id
                        ? {
                              ...p,
                              usuario: {
                                  ...p.usuario,
                                  foto_url: updated.foto_url,
                              },
                          }
                        : p
                )
            );
        } catch (e: unknown) {
            Alert.alert("Erro", apiErrorMessage(e, "Não foi possível enviar a foto"));
        } finally {
            setFotoBusy(false);
        }
    };

    const confirmRemoveFoto = () => {
        if (!isMe || !hasPhoto || fotoBusy) return;

        const run = async () => {
            setFotoBusy(true);
            try {
                const updated = await deleteFoto();
                applyUserUpdate(updated);
                setPosts((prev) =>
                    prev.map((p) =>
                        p.usuario?.id === updated.id
                            ? {
                                  ...p,
                                  usuario: {
                                      ...p.usuario,
                                      foto_url: null,
                                  },
                              }
                            : p
                    )
                );
            } catch (e: unknown) {
                Alert.alert("Erro", apiErrorMessage(e, "Não foi possível remover a foto"));
            } finally {
                setFotoBusy(false);
            }
        };

        if (Platform.OS === "web") {
            if (typeof window !== "undefined" && window.confirm("Remover foto de perfil?")) {
                void run();
            }
            return;
        }

        Alert.alert("Remover foto", "Remover a foto de perfil?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Remover", style: "destructive", onPress: () => { void run(); } },
        ]);
    };

    const onAvatarPress = () => {
        if (hasPhoto) {
            setViewerOpen(true);
            return;
        }
        if (isMe) {
            void pickAndUploadFoto();
        }
    };

    const openEdit = () => {
        if (!user) return;
        setEditNome(user.nome);
        setEditEmail(user.email);
        setEditSenha("");
        setEditOpen(true);
    };

    const saveEdit = async () => {
        const nome = editNome.trim();
        const email = editEmail.trim().toLowerCase();
        if (!nome || !email) {
            Alert.alert("Atenção", "Nome e e-mail são obrigatórios.");
            return;
        }
        setSaving(true);
        try {
            const payload: { nome?: string; email?: string; senha?: string } = {
                nome,
                email,
            };
            if (editSenha.trim()) payload.senha = editSenha.trim();
            const updated = await updateMe(payload);
            applyUserUpdate(updated);
            setEditOpen(false);
        } catch (e: unknown) {
            Alert.alert("Erro", apiErrorMessage(e, "Não foi possível salvar"));
        } finally {
            setSaving(false);
        }
    };

    const confirmDeleteAccount = () => {
        const run = async () => {
            try {
                await deleteMe();
                await signOut();
            } catch (e: unknown) {
                Alert.alert("Erro", apiErrorMessage(e, "Não foi possível excluir a conta"));
            }
        };

        if (Platform.OS === "web") {
            if (
                typeof window !== "undefined" &&
                window.confirm("Excluir sua conta permanentemente?")
            ) {
                void run();
            }
            return;
        }

        Alert.alert(
            "Excluir conta",
            "Isso remove seus posts e relações. Continuar?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir", style: "destructive", onPress: () => { void run(); } },
            ]
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
                <View style={styles.identityRow}>
                    <Pressable
                        onPress={onAvatarPress}
                        disabled={fotoBusy}
                        accessibilityRole="button"
                        accessibilityHint={
                            hasPhoto
                                ? "Toque para ver a foto em tela cheia"
                                : isMe
                                  ? "Toque para escolher uma foto"
                                  : undefined
                        }
                    >
                        <View>
                            <Avatar nome={user.nome} uri={user.foto_url} size="lg" />
                            {fotoBusy ? (
                                <View style={styles.avatarBusy}>
                                    <ActivityIndicator color="#fff" />
                                </View>
                            ) : null}
                        </View>
                    </Pressable>
                    <View style={styles.identityText}>
                        <Text style={styles.name}>{user.nome}</Text>
                        <Text style={styles.email}>{user.email}</Text>
                        {hasPhoto ? (
                            <Text style={styles.hint}>Toque na foto para ampliar</Text>
                        ) : isMe ? (
                            <Text style={styles.hint}>Toque no avatar para adicionar foto</Text>
                        ) : null}
                    </View>
                </View>

                {stats ? (
                    <View style={styles.counters}>
                        <Text style={styles.counter}>{stats.posts} posts</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.counter}>{stats.seguidores} seguidores</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.counter}>{stats.seguindo} seguindo</Text>
                    </View>
                ) : null}

                {isMe ? <Text style={styles.badge}>Seu perfil</Text> : null}

                <View style={styles.actionsRow}>
                    {!isMe && viewingUserId != null ? (
                        <Button
                            title={
                                followBusy
                                    ? "..."
                                    : following
                                      ? "Deixar de seguir"
                                      : "Seguir"
                            }
                            onPress={toggleFollow}
                            disabled={followBusy}
                        />
                    ) : null}
                    {isMe ? (
                        <>
                            <Button
                                title={fotoBusy ? "Enviando..." : "Alterar foto"}
                                onPress={pickAndUploadFoto}
                                disabled={fotoBusy}
                            />
                            {hasPhoto ? (
                                <Button
                                    title="Remover foto"
                                    color="#a33"
                                    onPress={confirmRemoveFoto}
                                    disabled={fotoBusy}
                                />
                            ) : null}
                            <Button title="Editar perfil" onPress={openEdit} />
                            <Button
                                title="Excluir conta"
                                color="#a33"
                                onPress={confirmDeleteAccount}
                            />
                        </>
                    ) : null}
                </View>
            </View>

            <FlatList
                data={posts}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <PostCard
                        item={item}
                        currentUserId={me?.id}
                        onPressAuthor={(userId) => {
                            if (userId !== viewingUserId) {
                                navigation.push("Profile", { userId });
                            }
                        }}
                        onDeleted={(id) => {
                            setPosts((prev) => prev.filter((p) => p.id !== id));
                            setStats((s) =>
                                s ? { ...s, posts: Math.max(0, s.posts - 1) } : s
                            );
                        }}
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
                        <Text>Sem posts por aqui.</Text>
                    </View>
                }
            />

            <PhotoViewer
                visible={viewerOpen}
                uri={user.foto_url}
                nome={user.nome}
                onClose={() => setViewerOpen(false)}
            />

            <Modal visible={editOpen} animationType="slide" transparent>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Editar perfil</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nome"
                            value={editNome}
                            onChangeText={setEditNome}
                            editable={!saving}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="E-mail"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={editEmail}
                            onChangeText={setEditEmail}
                            editable={!saving}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Nova senha (opcional)"
                            secureTextEntry
                            value={editSenha}
                            onChangeText={setEditSenha}
                            editable={!saving}
                        />
                        <View style={styles.modalActions}>
                            <Pressable
                                onPress={() => setEditOpen(false)}
                                disabled={saving}
                            >
                                <Text style={styles.cancel}>Cancelar</Text>
                            </Pressable>
                            <Button
                                title={saving ? "Salvando..." : "Salvar"}
                                onPress={saveEdit}
                                disabled={saving}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 8 },
    identityRow: { flexDirection: "row", alignItems: "center", gap: 14 },
    identityText: { flex: 1, minWidth: 0, gap: 2 },
    name: { fontSize: 22, fontWeight: "700" },
    email: { color: "#666" },
    hint: { color: "#888", fontSize: 12, marginTop: 4 },
    avatarBusy: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.35)",
        borderRadius: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    counters: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
        flexWrap: "wrap",
    },
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
    actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        padding: 24,
    },
    modalCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        gap: 10,
    },
    modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    modalActions: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 8,
    },
    cancel: { color: "#555", fontSize: 16, padding: 8 },
});
