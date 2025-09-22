import React, { useContext } from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { AuthContext } from "../auth/AuthProvider";

export default function HomeScreen() {
    const { logout } = useContext(AuthContext);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Home</Text>
            <Text>Bem-vindo ao RocketMail 👋</Text>

            <View style={{ height: 16 }} />

            <Button title="Sair" onPress={logout} />
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
