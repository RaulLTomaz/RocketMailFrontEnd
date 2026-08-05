import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Alert,
    Platform,
    Modal,
    Pressable,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
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
import Screen from "../components/ui/Screen";
import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ThemeToggle";
import ContentColumn from "../components/ui/ContentColumn";
import { checkPassword } from "../utils/password";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

const PAGE_SIZE = 20;

export default function ProfileScreen({ route }: Props) {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { user: me, signOut, setUser, isFollowing, follow, unfollow } = useAuth();
    const { colors } = useTheme();

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
            // sem crop circular/quadrado — envia a foto completa
            allowsEditing: false,
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
        if (isMe || hasPhoto) {
            setViewerOpen(true);
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
        if (editSenha.trim()) {
            const check = checkPassword(editSenha.trim());
            if (!check.ok) {
                Alert.alert("Senha inválida", check.message ?? "Senha fraca.");
                return;
            }
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
            <Screen style={styles.loading} safe={false}>
                <ActivityIndicator color={colors.accent} />
            </Screen>
        );
    }

    if (!user) {
        return (
            <Screen style={styles.loading} safe={false}>
                <Text style={{ color: colors.textMuted }}>Usuário não encontrado.</Text>
            </Screen>
        );
    }

    return (
        <Screen safe={false}>
            <ContentColumn style={styles.flex}>
                <View style={styles.header}>
                    <View style={styles.themeRow}>
                        <Text style={[styles.themeLabel, { color: colors.textMuted }]}>
                            Aparência
                        </Text>
                        <View style={styles.headerActions}>
                            <ThemeToggle size="sm" />
                            <Button title="Sair" variant="ghost" onPress={handleSignOut} />
                        </View>
                    </View>

                    <View style={styles.identityRow}>
                        <Pressable
                            onPress={onAvatarPress}
                            disabled={fotoBusy || (!isMe && !hasPhoto)}
                            accessibilityRole="button"
                            accessibilityHint={
                                hasPhoto || isMe
                                    ? "Toque para ver a foto em tela cheia"
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
                            <Text style={[styles.name, { color: colors.text }]}>
                                {user.nome}
                            </Text>
                            <Text style={[styles.email, { color: colors.textMuted }]}>
                                {user.email}
                            </Text>
                            {isMe || hasPhoto ? (
                                <Text style={[styles.hint, { color: colors.textMuted }]}>
                                    Toque na foto para gerenciar
                                </Text>
                            ) : null}
                        </View>
                    </View>

                    {stats ? (
                        <View style={styles.counters}>
                            <Text style={[styles.counter, { color: colors.text }]}>
                                <Text style={{ fontWeight: "700" }}>{stats.posts}</Text> posts
                            </Text>
                            <Text style={[styles.dot, { color: colors.textMuted }]}>•</Text>
                            <Text style={[styles.counter, { color: colors.text }]}>
                                <Text style={{ fontWeight: "700" }}>{stats.seguidores}</Text>{" "}
                                seguidores
                            </Text>
                            <Text style={[styles.dot, { color: colors.textMuted }]}>•</Text>
                            <Text style={[styles.counter, { color: colors.text }]}>
                                <Text style={{ fontWeight: "700" }}>{stats.seguindo}</Text>{" "}
                                seguindo
                            </Text>
                        </View>
                    ) : null}

                    {isMe ? (
                        <Text
                            style={[
                                styles.badge,
                                {
                                    backgroundColor: colors.accentMuted,
                                    color: colors.accent,
                                },
                            ]}
                        >
                            Seu perfil
                        </Text>
                    ) : null}

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
                                loading={followBusy}
                                variant={following ? "ghost" : "primary"}
                            />
                        ) : null}
                        {isMe ? (
                            <>
                                <Button
                                    title="Editar perfil"
                                    onPress={openEdit}
                                    variant="ghost"
                                />
                                <Button
                                    title="Excluir conta"
                                    variant="danger"
                                    onPress={confirmDeleteAccount}
                                />
                            </>
                        ) : null}
                    </View>
                </View>

                <FlatList
                    style={styles.flex}
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
                                Sem posts por aqui.
                            </Text>
                        </View>
                    }
                />
            </ContentColumn>

            <PhotoViewer
                visible={viewerOpen}
                uri={user.foto_url}
                nome={user.nome}
                onClose={() => setViewerOpen(false)}
                isOwner={isMe}
                fotoBusy={fotoBusy}
                onChangePhoto={() => {
                    void pickAndUploadFoto();
                }}
                onRemovePhoto={confirmRemoveFoto}
            />

            <Modal visible={editOpen} animationType="slide" transparent>
                <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
                    <View
                        style={[
                            styles.modalCard,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            Editar perfil
                        </Text>
                        <TextField
                            placeholder="Nome"
                            value={editNome}
                            onChangeText={setEditNome}
                            editable={!saving}
                        />
                        <TextField
                            placeholder="E-mail"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={editEmail}
                            onChangeText={setEditEmail}
                            editable={!saving}
                        />
                        <TextField
                            placeholder="Nova senha (opcional)"
                            secureTextEntry
                            value={editSenha}
                            onChangeText={setEditSenha}
                            editable={!saving}
                        />
                        {editSenha.trim() ? (
                            <Text style={{ fontSize: 12, color: colors.textMuted }}>
                                Senha: 8+ chars, maiúscula, número e símbolo
                            </Text>
                        ) : null}
                        <View style={styles.modalActions}>
                            <Pressable
                                onPress={() => setEditOpen(false)}
                                disabled={saving}
                            >
                                <Text style={[styles.cancel, { color: colors.textMuted }]}>
                                    Cancelar
                                </Text>
                            </Pressable>
                            <Button
                                title={saving ? "Salvando..." : "Salvar"}
                                onPress={saveEdit}
                                disabled={saving}
                                loading={saving}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    loading: { justifyContent: "center", alignItems: "center" },
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 10 },
    themeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    themeLabel: { fontSize: 14, fontWeight: "500" },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    identityRow: { flexDirection: "row", alignItems: "center", gap: 14 },
    identityText: { flex: 1, minWidth: 0, gap: 2 },
    name: { fontSize: 22, fontWeight: "800" },
    email: { fontSize: 14 },
    hint: { fontSize: 12, marginTop: 4 },
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
    counter: { fontSize: 14 },
    dot: {},
    badge: {
        marginTop: 2,
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: "600",
        overflow: "hidden",
    },
    actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
    modalBackdrop: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
        alignItems: "center",
    },
    modalCard: {
        borderRadius: 14,
        padding: 16,
        gap: 10,
        borderWidth: 1,
        width: "100%",
        maxWidth: 400,
    },
    modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
    modalActions: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 8,
    },
    cancel: { fontSize: 16, padding: 8 },
});
