import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "rocketmail_token";

export async function saveToken(token: string): Promise<void> {
    if (Platform.OS === "web") {
        await AsyncStorage.setItem(TOKEN_KEY, token);
        return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
    if (Platform.OS === "web") {
        return AsyncStorage.getItem(TOKEN_KEY);
    }
    try {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
        return null;
    }
}

export async function clearToken(): Promise<void> {
    if (Platform.OS === "web") {
        await AsyncStorage.removeItem(TOKEN_KEY);
        return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
}
