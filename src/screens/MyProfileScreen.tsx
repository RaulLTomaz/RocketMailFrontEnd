import React from "react";
import { ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import ProfileScreen from "./ProfileScreen";
import Screen from "../components/ui/Screen";

/** Aba Perfil: reusa ProfileScreen com o usuário autenticado (evita duplicar a tela). */
export default function MyProfileScreen() {
    const { user } = useAuth();
    const { colors } = useTheme();

    if (!user) {
        return (
            <Screen style={{ justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator color={colors.accent} />
            </Screen>
        );
    }

    return (
        <Screen>
            <ProfileScreen route={{ params: { userId: user.id } }} />
        </Screen>
    );
}
