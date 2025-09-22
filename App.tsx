import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import HomeScreen from "./src/screens/HomeScreen";
import AuthProvider, { AuthContext } from "./src/auth/AuthProvider";
import { ActivityIndicator, View } from "react-native";

export type RootStackParamList = {
    Login: undefined;
    Signup: undefined;
    Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function Router() {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? (
                <Stack.Navigator>
                    <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Início" }} />
                </Stack.Navigator>
            ) : (
                <Stack.Navigator initialRouteName="Login">
                    <Stack.Screen name="Login" component={LoginScreen} options={{ title: "RocketMail - Login" }} />
                    <Stack.Screen name="Signup" component={SignupScreen} options={{ title: "Criar conta" }} />
                </Stack.Navigator>
            )}
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Router />
        </AuthProvider>
    );
}
