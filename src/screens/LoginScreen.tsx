import React, { useState } from "react";
import { View, Text, TextInput, Button, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";

type Props = {
    navigation: {
        navigate: (route: string) => void;
    };
};

export default function LoginScreen({ navigation }: Props) {
    const { signIn } = useAuth();
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
            // não navega manualmente -> RootNavigator já redireciona
        } catch (e: any) {
            setErr(e?.response?.data?.detail || e?.message || "Falha no login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, gap: 12, padding: 16, justifyContent: "center" }}>
            <Text style={{ fontSize: 22, fontWeight: "600" }}>Entrar</Text>

            <TextInput
                placeholder="E-mail"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
                editable={!loading}
            />

            <TextInput
                placeholder="Senha"
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
                style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
                editable={!loading}
            />

            {err ? <Text style={{ color: "red" }}>{err}</Text> : null}

            {loading ? (
                <ActivityIndicator />
            ) : (
                <Button title="Entrar" onPress={onSubmit} />
            )}

            <Text style={{ textAlign: "center", marginTop: 8 }}>
                Novo por aqui?{" "}
                <Text style={{ color: "blue" }} onPress={() => navigation.navigate("Signup")}>
                    Criar conta
                </Text>
            </Text>
        </View>
    );
}
