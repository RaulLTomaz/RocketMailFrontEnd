import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View, Text, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
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
    const { colors } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: {
                    backgroundColor: colors.tabBar,
                    borderTopColor: colors.border,
                },
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
    const { colors, isDark } = useTheme();
    const isAuth = !!user;

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: colors.background,
                }}
            >
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                <ActivityIndicator color={colors.accent} />
            </View>
        );
    }

    if (isAuth) {
        return (
            <>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                <Stack.Navigator
                    screenOptions={{
                        headerStyle: { backgroundColor: colors.surface },
                        headerTintColor: colors.text,
                        headerTitleStyle: { fontWeight: "600" },
                        contentStyle: { backgroundColor: colors.background },
                    }}
                >
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
            </>
        );
    }

    return (
        <>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                    headerStyle: { backgroundColor: colors.surface },
                    headerTintColor: colors.text,
                }}
            >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen
                    name="Signup"
                    component={SignupScreen}
                    options={{ headerShown: true, headerTitle: "Criar conta" }}
                />
            </Stack.Navigator>
        </>
    );
}

function AppShell() {
    const { navigationTheme } = useTheme();

    return (
        <NavigationContainer theme={navigationTheme}>
            <RootNavigator />
        </NavigationContainer>
    );
}

export default function App() {
    useWarmUpServer();

    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AuthProvider>
                    <AppShell />
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
