import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import ProfileScreen from "./ProfileScreen";
import type { RootStackParamList } from "../types/navigation";

/** Aba "Perfil": reutiliza ProfileScreen com o usuário autenticado. */
export default function MyProfileScreen() {
    const { user } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    if (!user) {
        return (
            <View style={{ flex: 1, justifyContent: "center" }}>
                <ActivityIndicator />
            </View>
        );
    }

    return (
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
    );
}
