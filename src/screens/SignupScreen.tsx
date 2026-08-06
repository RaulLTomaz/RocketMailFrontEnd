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
import { checkPassword } from "../utils/password";
import Screen from "../components/ui/Screen";
import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ThemeToggle";
import ContentColumn, { AUTH_MAX_WIDTH } from "../components/ui/ContentColumn";

export default function SignupScreen({ navigation }: any) {
    const { signUp } = useAuth();
    const { colors } = useTheme();
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const pwd = checkPassword(senha);

    const onSubmit = async () => {
        const nomeT = nome.trim();
        const emailT = email.trim().toLowerCase();
        const senhaT = senha;

        if (!nomeT || !emailT || !senhaT) {
            setErr("Preencha nome, e-mail e senha.");
            return;
        }

        const check = checkPassword(senhaT);
        if (!check.ok) {
            setErr(check.message);
            return;
        }

        setLoading(true);
        setErr(null);
        try {
            await signUp({ nome: nomeT, email: emailT, senha: senhaT });
        } catch (e: unknown) {
            setErr(apiErrorMessage(e, "Falha no cadastro"));
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = !!(nome.trim() && email.trim() && senha && pwd.ok);

    return (
        <Screen edges={["left", "right", "bottom"]}>
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
                        </View>

                        <Text style={[styles.title, { color: colors.text }]}>Criar conta</Text>

                        <View style={styles.fields}>
                            <TextField
                                placeholder="Nome"
                                value={nome}
                                onChangeText={setNome}
                                editable={!loading}
                                style={styles.field}
                            />

                            <TextField
                                placeholder="E-mail"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                                editable={!loading}
                                autoComplete="email"
                                style={styles.field}
                            />

                            <TextField
                                placeholder="Senha"
                                secureTextEntry
                                value={senha}
                                onChangeText={setSenha}
                                editable={!loading}
                                autoComplete="password-new"
                                style={styles.field}
                            />
                        </View>

                        <View style={styles.rules}>
                            <RuleOk
                                ok={pwd.rules.minLength}
                                label="Mín. 8 caracteres"
                                colors={colors}
                            />
                            <RuleOk
                                ok={pwd.rules.uppercase}
                                label="Uma letra maiúscula"
                                colors={colors}
                            />
                            <RuleOk
                                ok={pwd.rules.number}
                                label="Um número"
                                colors={colors}
                            />
                            <RuleOk
                                ok={pwd.rules.symbol}
                                label="Um símbolo (!@#$…)"
                                colors={colors}
                            />
                        </View>

                        {err ? (
                            <Text style={[styles.error, { color: colors.danger }]}>{err}</Text>
                        ) : null}

                        {loading ? (
                            <ActivityIndicator
                                color={colors.accent}
                                style={{ marginTop: 8 }}
                            />
                        ) : (
                            <Button
                                title="Criar conta"
                                onPress={onSubmit}
                                disabled={!canSubmit}
                                style={styles.submit}
                            />
                        )}

                        <Text style={[styles.footer, { color: colors.textMuted }]}>
                            Já tem conta?{" "}
                            <Text
                                style={{ color: colors.accent, fontWeight: "600" }}
                                onPress={() => navigation.navigate("Login")}
                            >
                                Entrar
                            </Text>
                        </Text>
                    </ContentColumn>
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

function RuleOk({
    ok,
    label,
    colors,
}: {
    ok: boolean;
    label: string;
    colors: { success: string; textMuted: string };
}) {
    return (
        <Text style={{ fontSize: 12, color: ok ? colors.success : colors.textMuted }}>
            {ok ? "✓" : "○"} {label}
        </Text>
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
        width: "100%",
    },
    fields: {
        width: "100%",
    },
    field: {
        marginBottom: 14,
    },
    brand: {
        alignItems: "center",
        marginBottom: 8,
        gap: 4,
    },
    logo: {
        width: 88,
        height: 88,
    },
    brandName: {
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 8,
        textAlign: "center",
    },
    rules: {
        gap: 6,
        marginTop: 2,
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
