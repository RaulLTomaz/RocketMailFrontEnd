import React, { useState } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    Image,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { apiErrorMessage } from "../utils/apiError";
import Screen from "../components/ui/Screen";
import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ThemeToggle";
import ContentColumn, { AUTH_MAX_WIDTH } from "../components/ui/ContentColumn";

type Props = {
    navigation: {
        navigate: (route: string) => void;
    };
};

export default function LoginScreen({ navigation }: Props) {
    const { signIn } = useAuth();
    const { colors } = useTheme();
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const onSubmit = async () => {
        if (loading) return;
        setLoading(true);
        setErr(null);
        try {
            const payload = { email: email.trim().toLowerCase(), senha };
            await signIn(payload);
        } catch (e: unknown) {
            setErr(apiErrorMessage(e, "Falha no login"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen>
            <View style={styles.topBar}>
                <ThemeToggle size="sm" />
            </View>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                    <ContentColumn maxWidth={AUTH_MAX_WIDTH} fill={false} style={styles.column}>
                        <View style={styles.brand}>
                            <Image
                                source={require("../images/logo.png")}
                                style={styles.logo}
                                resizeMode="contain"
                                accessibilityLabel="RocketMail"
                            />
                            <Text style={[styles.brandName, { color: colors.text }]}>
                                RocketMail
                            </Text>
                            <Text style={[styles.tagline, { color: colors.textMuted }]}>
                                Sua rede social em órbita
                            </Text>
                        </View>

                        <Text style={[styles.title, { color: colors.text }]}>Entrar</Text>

                        <TextField
                            placeholder="E-mail"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                            editable={!loading}
                            autoComplete="email"
                        />

                        <TextField
                            placeholder="Senha"
                            secureTextEntry
                            value={senha}
                            onChangeText={setSenha}
                            editable={!loading}
                            autoComplete="password"
                        />

                        {err ? (
                            <Text style={[styles.error, { color: colors.danger }]}>{err}</Text>
                        ) : null}

                        {loading ? (
                            <ActivityIndicator
                                color={colors.accent}
                                style={{ marginTop: 8 }}
                            />
                        ) : (
                            <Button title="Entrar" onPress={onSubmit} style={styles.submit} />
                        )}

                        <Text style={[styles.footer, { color: colors.textMuted }]}>
                            Novo por aqui?{" "}
                            <Text
                                style={{ color: colors.accent, fontWeight: "600" }}
                                onPress={() => navigation.navigate("Signup")}
                            >
                                Criar conta
                            </Text>
                        </Text>
                    </ContentColumn>
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    topBar: {
        alignItems: "flex-end",
        paddingHorizontal: 16,
        paddingTop: 4,
    },
    scroll: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    column: {
        gap: 18,
        alignSelf: "center",
    },
    brand: {
        alignItems: "center",
        marginBottom: 12,
        gap: 6,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 4,
    },
    brandName: {
        fontSize: 28,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    tagline: {
        fontSize: 14,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 8,
        textAlign: "center",
    },
    error: {
        fontSize: 14,
        textAlign: "center",
        marginTop: 4,
    },
    submit: {
        marginTop: 8,
    },
    footer: {
        textAlign: "center",
        marginTop: 16,
        fontSize: 15,
    },
});
