import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import { api } from "./src/api/client";
import type { RootStackParamList } from "./src/types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

function useWarmUpServer() {
    useEffect(() => {
        api.get("/healthz").catch(() => {});
    }, []);
}

function RootNavigator() {
    const { user, loading } = useAuth();
    const isAuth = !!user;

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center" }}>
                <ActivityIndicator />
            </View>
        );
    }

    if (isAuth) {
        return (
            <Stack.Navigator screenOptions={{ headerShown: true }}>
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ headerTitle: "Home" }}
                />
                <Stack.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{ headerTitle: "Perfil" }}
                />
            </Stack.Navigator>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
                name="Signup"
                component={SignupScreen}
                options={{ headerShown: true, headerTitle: "Criar conta" }}
            />
        </Stack.Navigator>
    );
}

export default function App() {
    useWarmUpServer();

    return (
        <AuthProvider>
            <NavigationContainer>
                <RootNavigator />
            </NavigationContainer>
        </AuthProvider>
    );
}
