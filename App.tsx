import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ExploreScreen from "./src/screens/ExploreScreen";
import MyProfileScreen from "./src/screens/MyProfileScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import { api } from "./src/api/client";
import type { MainTabParamList, RootStackParamList } from "./src/types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function useWarmUpServer() {
    useEffect(() => {
        api.get("/healthz").catch(() => {});
    }, []);
}

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#111",
                tabBarInactiveTintColor: "#888",
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: "Feed",
                    tabBarIcon: ({ color }) => (
                        <Text style={{ color, fontSize: 18 }}>⌂</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Explore"
                component={ExploreScreen}
                options={{
                    title: "Explorar",
                    tabBarIcon: ({ color }) => (
                        <Text style={{ color, fontSize: 16 }}>⌕</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="MyProfile"
                component={MyProfileScreen}
                options={{
                    title: "Perfil",
                    tabBarIcon: ({ color }) => (
                        <Text style={{ color, fontSize: 16 }}>☺</Text>
                    ),
                }}
            />
        </Tab.Navigator>
    );
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
            <Stack.Navigator>
                <Stack.Screen
                    name="MainTabs"
                    component={MainTabs}
                    options={{ headerShown: false }}
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
        <SafeAreaProvider>
            <AuthProvider>
                <NavigationContainer>
                    <RootNavigator />
                </NavigationContainer>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
