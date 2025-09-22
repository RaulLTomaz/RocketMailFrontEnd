import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SignupScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Criar conta</Text>
            <Text>Em breve: formulário de cadastro.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
    },
});
