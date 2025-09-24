import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import HomeScreen from "./src/screens/HomeScreen";
import { api } from "./src/api/client";

const Stack = createNativeStackNavigator();

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

    return (
        <Stack.Navigator
            // a key força o Stack a ser remontado quando o estado de auth muda
            key={isAuth ? "app" : "auth"}
            // define a rota inicial conforme login
            initialRouteName={isAuth ? "Home" : "Login"}
            // esconde header por padrão (e sobrescrevemos onde quiser)
            screenOptions={{ headerShown: false }}
        >
            {/* Home sempre registrada para que navigation.replace('Home') funcione */}
            <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ headerShown: true, headerTitle: "Home" }}
            />

            <Stack.Screen
                name="Login"
                component={LoginScreen}
                // header já escondido pelo screenOptions
            />

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
