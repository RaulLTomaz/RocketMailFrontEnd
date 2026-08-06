import React from "react";
import { ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import ProfileScreen from "./ProfileScreen";
import type { RootStackParamList } from "../types/navigation";
import Screen from "../components/ui/Screen";

/** Aba Perfil: reusa ProfileScreen com o usuário autenticado (evita duplicar a tela). */
export default function MyProfileScreen() {
    const { user } = useAuth();
    const { colors } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    if (!user) {
        return (
            <Screen style={{ justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator color={colors.accent} />
            </Screen>
        );
    }

    return (
        <Screen>
            <ProfileScreen
                route={
                    {
                        key: "MyProfile",
                        name: "Profile",
                        params: { userId: user.id },
                    } as any
                }
                navigation={navigation as any}
            />
        </Screen>
    );
}
