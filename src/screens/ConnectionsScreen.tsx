import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { listSeguidos, listSeguidores } from "../api/follow";
import type { UsuarioOut } from "../api/users";
import type { RootStackParamList } from "../types/navigation";
import { apiErrorMessage } from "../utils/apiError";
import { useTheme } from "../theme/ThemeContext";
import Avatar from "../components/Avatar";
import Screen from "../components/ui/Screen";
import ContentColumn from "../components/ui/ContentColumn";
import Button from "../components/ui/Button";

type Tab = "seguidores" | "seguindo";

type Props = NativeStackScreenProps<RootStackParamList, "Connections">;

export default function ConnectionsScreen({ route }: Props) {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { colors } = useTheme();
    const initialTab = route.params?.tab ?? "seguidores";

    const [tab, setTab] = useState<Tab>(initialTab);
    const [users, setUsers] = useState<UsuarioOut[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setTab(route.params?.tab ?? "seguidores");
    }, [route.params?.tab]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data =
                tab === "seguidores" ? await listSeguidores() : await listSeguidos();
            setUsers(data);
        } catch (e: unknown) {
            setUsers([]);
            setError(
                apiErrorMessage(
                    e,
                    tab === "seguidores"
                        ? "Falha ao carregar seguidores"
                        : "Falha ao carregar seguidos"
                )
            );
        } finally {
            setLoading(false);
        }
    }, [tab]);

    useEffect(() => {
        void load();
    }, [load]);

    const emptyLabel =
        tab === "seguidores"
            ? "Você ainda não tem seguidores."
            : "Você ainda não segue ninguém.";

    return (
        <Screen>
            <ContentColumn style={styles.flex}>
                <View style={styles.tabs}>
                    <Pressable
                        onPress={() => setTab("seguidores")}
                        style={[
                            styles.tab,
                            {
                                borderColor: colors.border,
                                backgroundColor:
                                    tab === "seguidores" ? colors.accentMuted : colors.surface,
                            },
                        ]}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: tab === "seguidores" }}
                        accessibilityLabel="Seguidores"
                    >
                        <Text
                            style={{
                                color: tab === "seguidores" ? colors.accent : colors.text,
                                fontWeight: "700",
                            }}
                        >
                            Seguidores
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setTab("seguindo")}
                        style={[
                            styles.tab,
                            {
                                borderColor: colors.border,
                                backgroundColor:
                                    tab === "seguindo" ? colors.accentMuted : colors.surface,
                            },
                        ]}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: tab === "seguindo" }}
                        accessibilityLabel="Seguindo"
                    >
                        <Text
                            style={{
                                color: tab === "seguindo" ? colors.accent : colors.text,
                                fontWeight: "700",
                            }}
                        >
                            Seguindo
                        </Text>
                    </Pressable>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={colors.accent} />
                    </View>
                ) : error ? (
                    <View style={styles.center}>
                        <Text style={{ color: colors.danger, marginBottom: 8 }}>{error}</Text>
                        <Button title="Tentar novamente" variant="ghost" onPress={() => void load()} />
                    </View>
                ) : (
                    <FlatList
                        style={styles.flex}
                        data={users}
                        keyExtractor={(u) => String(u.id)}
                        contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
                        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Text style={{ color: colors.textMuted }}>{emptyLabel}</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <Pressable
                                style={[
                                    styles.row,
                                    {
                                        borderColor: colors.border,
                                        backgroundColor: colors.surface,
                                    },
                                ]}
                                onPress={() =>
                                    navigation.navigate("Profile", { userId: item.id })
                                }
                                accessibilityRole="button"
                                accessibilityLabel={`Abrir perfil de ${item.nome}`}
                            >
                                <Avatar nome={item.nome} uri={item.foto_url} size="md" />
                                <View style={styles.rowText}>
                                    <Text style={[styles.name, { color: colors.text }]}>
                                        {item.nome}
                                    </Text>
                                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                                        {item.email}
                                    </Text>
                                </View>
                            </Pressable>
                        )}
                    />
                )}
            </ContentColumn>
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    tabs: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
    },
    tab: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
    },
    rowText: { flex: 1, minWidth: 0, gap: 2 },
    name: { fontSize: 16, fontWeight: "700" },
});
