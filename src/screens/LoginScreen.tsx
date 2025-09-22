import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, TextInput, Button } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthContext } from "../auth/AuthProvider";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

const schema = z.object({
    email: z.string().email("E-mail inválido"),
    password: z.string().min(3, "Mínimo de 3 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen({ navigation }: Props) {
    const { login } = useContext(AuthContext);
    const [submitting, setSubmitting] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (data: FormData) => {
        setSubmitting(true);
        try {
            await login(data.email, data.password);
        } catch (e) {
            alert("Falha no login. Verifique suas credenciais.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>

            <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        placeholder="E-mail"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={styles.input}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                    />
                )}
            />
            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

            <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        placeholder="Senha"
                        secureTextEntry
                        style={styles.input}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                    />
                )}
            />
            {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

            <Button title={submitting ? "Entrando..." : "Entrar"} onPress={handleSubmit(onSubmit)} disabled={submitting} />

            <View style={{ height: 12 }} />

            <Button title="Ir para cadastro" onPress={() => navigation.navigate("Signup")} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        gap: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 16,
    },
    input: {
        width: "100%",
        maxWidth: 360,
        padding: 12,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 6,
        backgroundColor: "#fff",
    },
    error: {
        color: "#b00020",
        alignSelf: "flex-start",
        maxWidth: 360,
        marginBottom: 4,
    },
});
