import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Alert,
    Platform,
} from "react-native";
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
import PhotoViewer from "../components/PhotoViewer";
import ProfileHeader from "../components/ProfileHeader";
import EditProfileModal from "../components/EditProfileModal";
import Screen from "../components/ui/Screen";
import Button from "../components/ui/Button";
import ContentColumn from "../components/ui/ContentColumn";
import { checkPassword } from "../utils/password";

export type ProfileScreenProps = {
    route: { params: { userId: number } };
};

const PAGE_SIZE = 20;

function isCanceled(e: unknown): boolean {
    const err = e as { name?: string; message?: string };
    return err?.name === "CanceledError" || err?.message === "canceled";
}

export default function ProfileScreen({ route }: ProfileScreenProps) {
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
    const [listError, setListError] = useState<string | null>(null);
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
        const data = await getUserPosts(id, {
            limit: PAGE_SIZE,
            offset,
            signal: nextSignal(),
        });
        const withLikes = await attachLikes(data);
        setHasMore(data.length >= PAGE_SIZE);
        setPosts((prev) => (append ? [...prev, ...withLikes] : withLikes));
    }, []);

    const initialLoad = useCallback(async () => {
        if (!viewingUserId) return;
        try {
            setLoading(true);
            setListError(null);
            setHasMore(true);
            await Promise.all([
                loadHeader(viewingUserId),
                loadPage(viewingUserId, 0, false),
            ]);
        } catch (e: unknown) {
            if (isCanceled(e)) return;
            setHasMore(false);
            setListError(apiErrorMessage(e, "Falha ao carregar perfil"));
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
            setListError(null);
            setHasMore(true);
            await Promise.all([
                loadHeader(viewingUserId),
                loadPage(viewingUserId, 0, false),
            ]);
        } catch (e: unknown) {
            if (isCanceled(e)) return;
            setHasMore(false);
            setListError(apiErrorMessage(e, "Falha ao atualizar"));
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
            if (isCanceled(e)) return;
            setHasMore(false);
            setListError(apiErrorMessage(e, "Falha ao carregar mais posts"));
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
            // Sem crop: o usuário envia a foto completa (crop nativo distorce o avatar).
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
                <Text style={{ color: colors.textMuted, marginBottom: 12 }}>
                    {listError ?? "Usuário não encontrado."}
                </Text>
                {listError ? (
                    <Button title="Tentar novamente" onPress={() => void initialLoad()} />
                ) : null}
            </Screen>
        );
    }

    return (
        <Screen safe={false}>
            <ContentColumn style={styles.flex}>
                <ProfileHeader
                    user={user}
                    stats={stats}
                    isMe={isMe}
                    following={following}
                    followBusy={followBusy}
                    fotoBusy={fotoBusy}
                    hasPhoto={hasPhoto}
                    onAvatarPress={onAvatarPress}
                    onToggleFollow={() => {
                        void toggleFollow();
                    }}
                    onOpenEdit={openEdit}
                    onDeleteAccount={confirmDeleteAccount}
                    onSignOut={() => {
                        void handleSignOut();
                    }}
                    onPressSeguidores={
                        isMe
                            ? () => navigation.navigate("Connections", { tab: "seguidores" })
                            : undefined
                    }
                    onPressSeguindo={
                        isMe
                            ? () => navigation.navigate("Connections", { tab: "seguindo" })
                            : undefined
                    }
                />

                {listError ? (
                    <View style={styles.errorBanner}>
                        <Text style={[styles.errorText, { color: colors.danger }]}>
                            {listError}
                        </Text>
                        <Button
                            title="Tentar novamente"
                            variant="ghost"
                            onPress={() => void onRefresh()}
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
                                {listError ? "Não foi possível carregar os posts." : "Sem posts por aqui."}
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

            <EditProfileModal
                visible={editOpen}
                nome={editNome}
                email={editEmail}
                senha={editSenha}
                saving={saving}
                onChangeNome={setEditNome}
                onChangeEmail={setEditEmail}
                onChangeSenha={setEditSenha}
                onCancel={() => setEditOpen(false)}
                onSave={() => {
                    void saveEdit();
                }}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    loading: { justifyContent: "center", alignItems: "center" },
    errorBanner: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        gap: 4,
        alignItems: "flex-start",
    },
    errorText: { fontSize: 14 },
});
