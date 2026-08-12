import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    FlatList,
    Pressable,
    ActivityIndicator,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from "react-native";
import {
    listComments,
    createComment,
    deleteComment,
    type Comentario,
} from "../api/comments";
import { apiErrorMessage } from "../utils/apiError";
import { useTheme } from "../theme/ThemeContext";
import Avatar from "./Avatar";
import TextField from "./ui/TextField";
import Button from "./ui/Button";
import ContentColumn from "./ui/ContentColumn";

const MAX_LEN = 280;

type Props = {
    visible: boolean;
    postId: number;
    currentUserId?: number | null;
    onClose: () => void;
    onCountChange?: (count: number) => void;
    onPressAuthor?: (userId: number) => void;
};

function isCanceled(e: unknown): boolean {
    const err = e as { name?: string; message?: string };
    return err?.name === "CanceledError" || err?.message === "canceled";
}

export default function CommentsSheet({
    visible,
    postId,
    currentUserId,
    onClose,
    onCountChange,
    onPressAuthor,
}: Props) {
    const { colors } = useTheme();
    const [items, setItems] = useState<Comentario[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [texto, setTexto] = useState("");
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const load = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true);
        setError(null);
        try {
            const data = await listComments(postId, {
                limit: 100,
                signal: controller.signal,
            });
            if (controller.signal.aborted) return;
            setItems(data);
            onCountChange?.(data.length);
        } catch (e: unknown) {
            if (isCanceled(e)) return;
            setError(apiErrorMessage(e, "Falha ao carregar comentários"));
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, [postId, onCountChange]);

    useEffect(() => {
        if (!visible) {
            abortRef.current?.abort();
            setTexto("");
            setSendError(null);
            setError(null);
            return;
        }
        void load();
        return () => {
            abortRef.current?.abort();
        };
    }, [visible, load]);

    const onSubmit = async () => {
        const body = texto.trim();
        if (!body) {
            setSendError("Escreva um comentário antes de enviar.");
            return;
        }
        if (body.length > MAX_LEN) {
            setSendError(`Máximo de ${MAX_LEN} caracteres.`);
            return;
        }
        setSending(true);
        setSendError(null);
        try {
            const created = await createComment(postId, { comentario: body });
            setItems((prev) => {
                const next = [...prev, created];
                onCountChange?.(next.length);
                return next;
            });
            setTexto("");
        } catch (e: unknown) {
            setSendError(apiErrorMessage(e, "Não foi possível comentar"));
        } finally {
            setSending(false);
        }
    };

    const confirmDelete = (comentario: Comentario) => {
        const run = async () => {
            setDeletingId(comentario.id);
            try {
                await deleteComment(comentario.id);
                setItems((prev) => {
                    const next = prev.filter((c) => c.id !== comentario.id);
                    onCountChange?.(next.length);
                    return next;
                });
            } catch (e: unknown) {
                Alert.alert("Erro", apiErrorMessage(e, "Não foi possível excluir"));
            } finally {
                setDeletingId(null);
            }
        };

        if (Platform.OS === "web") {
            if (typeof window !== "undefined" && window.confirm("Excluir este comentário?")) {
                void run();
            }
            return;
        }

        Alert.alert("Excluir", "Excluir este comentário?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Excluir", style: "destructive", onPress: () => { void run(); } },
        ]);
    };

    const renderItem = ({ item }: { item: Comentario }) => {
        const isMine = currentUserId != null && item.usuario?.id === currentUserId;
        let when: string | undefined;
        if (item.data_criacao) {
            try {
                when = new Date(item.data_criacao).toLocaleString();
            } catch {}
        }

        return (
            <View
                style={[
                    styles.commentCard,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                ]}
            >
                <Pressable
                    style={styles.commentHeader}
                    onPress={() => {
                        if (item.usuario?.id != null) onPressAuthor?.(item.usuario.id);
                    }}
                    disabled={!onPressAuthor || item.usuario?.id == null}
                    accessibilityRole="button"
                    accessibilityLabel={`Perfil de ${item.usuario?.nome ?? "usuário"}`}
                >
                    <Avatar
                        nome={item.usuario?.nome}
                        uri={item.usuario?.foto_url}
                        size="sm"
                    />
                    <View style={styles.commentMeta}>
                        <Text style={[styles.author, { color: colors.text }]}>
                            {item.usuario?.nome ?? "Usuário"}
                        </Text>
                        {when ? (
                            <Text style={[styles.date, { color: colors.textMuted }]}>
                                {when}
                            </Text>
                        ) : null}
                    </View>
                </Pressable>
                <Text style={[styles.commentBody, { color: colors.text }]}>
                    {item.comentario}
                </Text>
                {isMine ? (
                    <Pressable
                        onPress={() => confirmDelete(item)}
                        disabled={deletingId === item.id}
                        style={styles.deleteBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Excluir comentário"
                    >
                        {deletingId === item.id ? (
                            <ActivityIndicator size="small" color={colors.danger} />
                        ) : (
                            <Text style={{ color: colors.danger, fontWeight: "600" }}>
                                Excluir
                            </Text>
                        )}
                    </Pressable>
                ) : null}
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={[styles.backdrop, { backgroundColor: colors.overlay }]}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ContentColumn maxWidth={560} fill={false} style={styles.sheetWrap}>
                    <View
                        style={[
                            styles.sheet,
                            {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <View style={styles.sheetHeader}>
                            <Text style={[styles.sheetTitle, { color: colors.text }]}>
                                Comentários
                            </Text>
                            <Pressable
                                onPress={onClose}
                                accessibilityRole="button"
                                accessibilityLabel="Fechar comentários"
                            >
                                <Text style={{ color: colors.accent, fontWeight: "600" }}>
                                    Fechar
                                </Text>
                            </Pressable>
                        </View>

                        {loading ? (
                            <View style={styles.center}>
                                <ActivityIndicator color={colors.accent} />
                            </View>
                        ) : error ? (
                            <View style={styles.center}>
                                <Text style={{ color: colors.danger, marginBottom: 8 }}>
                                    {error}
                                </Text>
                                <Button title="Tentar novamente" variant="ghost" onPress={() => void load()} />
                            </View>
                        ) : (
                            <FlatList
                                style={styles.list}
                                data={items}
                                keyExtractor={(c) => String(c.id)}
                                renderItem={renderItem}
                                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                                contentContainerStyle={{ paddingBottom: 12, flexGrow: 1 }}
                                ListEmptyComponent={
                                    <View style={styles.center}>
                                        <Text style={{ color: colors.textMuted }}>
                                            Nenhum comentário ainda. Seja o primeiro!
                                        </Text>
                                    </View>
                                }
                            />
                        )}

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
                                placeholder="Escreva um comentário…"
                                value={texto}
                                onChangeText={(t) => {
                                    setTexto(t.slice(0, MAX_LEN));
                                    if (sendError) setSendError(null);
                                }}
                                editable={!sending}
                                multiline
                                maxLength={MAX_LEN}
                                style={styles.composerInput}
                            />
                            <View style={styles.composerFooter}>
                                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                                    {texto.length}/{MAX_LEN}
                                </Text>
                                <Button
                                    title={sending ? "Enviando..." : "Comentar"}
                                    onPress={() => {
                                        void onSubmit();
                                    }}
                                    disabled={sending || !texto.trim()}
                                    loading={sending}
                                />
                            </View>
                            {sendError ? (
                                <Text style={{ color: colors.danger, fontSize: 13 }}>
                                    {sendError}
                                </Text>
                            ) : null}
                        </View>
                    </View>
                </ContentColumn>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: "flex-end",
        padding: 12,
    },
    sheetWrap: {
        width: "100%",
        maxHeight: "90%",
        alignSelf: "center",
    },
    sheet: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        maxHeight: "100%",
        minHeight: 360,
        gap: 10,
    },
    sheetHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    sheetTitle: { fontSize: 18, fontWeight: "700" },
    list: { flexGrow: 1, maxHeight: 360 },
    center: {
        paddingVertical: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    commentCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        gap: 8,
    },
    commentHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    commentMeta: { flex: 1, minWidth: 0 },
    author: { fontWeight: "700", fontSize: 14 },
    date: { fontSize: 12, marginTop: 2 },
    commentBody: { fontSize: 15, lineHeight: 21 },
    deleteBtn: { alignSelf: "flex-start", minHeight: 32, justifyContent: "center" },
    composer: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 10,
        gap: 8,
    },
    composerInput: {
        minHeight: 56,
        textAlignVertical: "top",
    },
    composerFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
});
