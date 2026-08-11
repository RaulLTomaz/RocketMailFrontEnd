process.env.API_URL =
    process.env.API_URL || "https://rocketmail-django.onrender.com";

// Unitários não batem no Render. Integração usa axios real.
jest.mock("axios", () => {
    const testPath = expect.getState().testPath || "";
    if (/integration/i.test(testPath)) {
        return jest.requireActual("axios");
    }

    const mockAxios: {
        create: () => unknown;
        get: jest.Mock;
        post: jest.Mock;
        patch: jest.Mock;
        delete: jest.Mock;
        interceptors: {
            request: { use: jest.Mock };
            response: { use: jest.Mock };
        };
        defaults: { timeout: number; baseURL: string };
    } = {
        create() {
            return mockAxios;
        },
        get: jest.fn(async () => ({ data: [], status: 200, config: {} })),
        post: jest.fn(async () => ({ data: {}, status: 200, config: {} })),
        patch: jest.fn(async () => ({ data: {}, status: 200, config: {} })),
        delete: jest.fn(async () => ({ data: {}, status: 200, config: {} })),
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() },
        },
        defaults: { timeout: 0, baseURL: "" },
    };
    return { __esModule: true, default: mockAxios };
});

jest.mock("expo-constants", () => ({
    __esModule: true,
    default: {
        expoConfig: {
            extra: {
                API_URL: process.env.API_URL,
            },
        },
    },
}));

jest.mock("@react-native-async-storage/async-storage", () => {
    let store: Record<string, string> = {};
    return {
        __esModule: true,
        default: {
            getItem: jest.fn(async (key: string) =>
                Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
            ),
            setItem: jest.fn(async (key: string, value: string) => {
                store[key] = value;
            }),
            removeItem: jest.fn(async (key: string) => {
                delete store[key];
            }),
            clear: jest.fn(async () => {
                store = {};
            }),
        },
    };
});

jest.mock("expo-secure-store", () => ({
    getItemAsync: jest.fn(async () => null),
    setItemAsync: jest.fn(async () => undefined),
    deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock("@react-navigation/native", () => ({
    DarkTheme: {
        dark: true,
        colors: {
            primary: "#3B9EFF",
            background: "#070B14",
            card: "#121826",
            text: "#E8EEF8",
            border: "#243044",
            notification: "#F97316",
        },
    },
    DefaultTheme: {
        dark: false,
        colors: {
            primary: "#2B7FFF",
            background: "#F4F7FC",
            card: "#FFFFFF",
            text: "#0B1220",
            border: "#D8E0EC",
            notification: "#EA580C",
        },
    },
    useNavigation: () => ({
        navigate: jest.fn(),
        push: jest.fn(),
        goBack: jest.fn(),
    }),
    NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("react-native-safe-area-context", () => {
    const React = require("react");
    const { View } = require("react-native");
    return {
        SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
            React.createElement(View, { style: { flex: 1 } }, children),
        SafeAreaView: ({ children, ...props }: any) =>
            React.createElement(View, props, children),
        useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    };
});
