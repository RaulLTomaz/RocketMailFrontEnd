import React, { useState } from "react";
import { View, Text, TextInput, Button, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }: any) {
    const { signIn } = useAuth();
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const onSubmit = async () => {
        setLoading(true);
        setErr(null);
        try {
            await signIn({ email, senha });
            navigation.replace("Home");
        } catch (e: any) {
            setErr(e?.response?.data?.detail || e.message || "Falha no login");
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
            />
            <TextInput
                placeholder="Senha"
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
                style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
            />
            {err && <Text style={{ color: "red" }}>{err}</Text>}
            {loading ? <ActivityIndicator /> : <Button title="Entrar" onPress={onSubmit} />}
            <Text style={{ textAlign: "center", marginTop: 8 }}>
                Novo por aqui?{" "}
                <Text style={{ color: "blue" }} onPress={() => navigation.navigate("Signup")}>
                    Criar conta
                </Text>
            </Text>
        </View>
    );
}
