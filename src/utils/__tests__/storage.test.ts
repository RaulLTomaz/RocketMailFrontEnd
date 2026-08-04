import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { saveToken, getToken, clearToken } from "../storage";

jest.mock("@react-native-async-storage/async-storage", () => ({
    setItem: jest.fn(async () => {}),
    getItem: jest.fn(async () => null),
    removeItem: jest.fn(async () => {}),
}));

jest.mock("expo-secure-store", () => ({
    setItemAsync: jest.fn(async () => {}),
    getItemAsync: jest.fn(async () => null),
    deleteItemAsync: jest.fn(async () => {}),
}));

const mockedAsync = AsyncStorage as unknown as {
    setItem: jest.Mock;
    getItem: jest.Mock;
    removeItem: jest.Mock;
};

describe("storage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (Platform as any).OS = "web";
    });

    it("save/get/clear token no web via AsyncStorage", async () => {
        mockedAsync.getItem.mockResolvedValueOnce("abc");

        await saveToken("abc");
        expect(mockedAsync.setItem).toHaveBeenCalledWith(
            "rocketmail_token",
            "abc"
        );

        await expect(getToken()).resolves.toBe("abc");
        expect(mockedAsync.getItem).toHaveBeenCalledWith("rocketmail_token");

        await clearToken();
        expect(mockedAsync.removeItem).toHaveBeenCalledWith("rocketmail_token");
    });
});
