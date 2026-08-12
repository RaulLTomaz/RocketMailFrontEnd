import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { ThemeProvider } from "../../theme/ThemeContext";

const mockGetUser = jest.fn();
const mockGetUserStats = jest.fn();
const mockGetUserPosts = jest.fn();
const mockFollowingIds = new Set<number>([10, 20]);

jest.mock("../../api/client", () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
    },
    setUnauthorizedHandler: jest.fn(),
}));

jest.mock("../../api/users", () => ({
    getUser: (...args: unknown[]) => mockGetUser(...args),
    getUserStats: (...args: unknown[]) => mockGetUserStats(...args),
    getUserPosts: (...args: unknown[]) => mockGetUserPosts(...args),
    updateMe: jest.fn(),
    deleteMe: jest.fn(),
    uploadFoto: jest.fn(),
    deleteFoto: jest.fn(),
}));

jest.mock("../../api/attachLikes", () => ({
    attachLikes: jest.fn(async (posts: unknown[]) => posts),
}));

jest.mock("expo-image-picker", () => ({
    requestMediaLibraryPermissionsAsync: jest.fn(),
    launchImageLibraryAsync: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ navigate: jest.fn(), push: jest.fn() }),
    useFocusEffect: (cb: () => void | (() => void)) => {
        const React = require("react");
        React.useEffect(() => {
            const cleanup = cb();
            return typeof cleanup === "function" ? cleanup : undefined;
        }, [cb]);
    },
}));

jest.mock("../../context/AuthContext", () => ({
    useAuth: () => ({
        user: { id: 1, nome: "Ana", email: "a@b.com", foto_url: null },
        loading: false,
        signOut: jest.fn(async () => undefined),
        followingIds: mockFollowingIds,
        isFollowing: (id: number) => mockFollowingIds.has(id),
        follow: jest.fn(),
        unfollow: jest.fn(),
        refreshFollowing: jest.fn(),
        signIn: jest.fn(),
        signUp: jest.fn(),
        setUser: jest.fn(),
    }),
}));

import ProfileScreen from "../ProfileScreen";

describe("ProfileScreen contagem seguindo", () => {
    beforeEach(() => {
        mockFollowingIds.clear();
        mockFollowingIds.add(10);
        mockFollowingIds.add(20);
        mockGetUser.mockResolvedValue({
            id: 1,
            nome: "Ana",
            email: "a@b.com",
            foto_url: null,
        });
        // Backend ainda retorna valor antigo (stale) — UI do próprio perfil deve usar followingIds.
        mockGetUserStats.mockResolvedValue({
            usuario: { id: 1, nome: "Ana", email: "a@b.com", foto_url: null },
            stats: { posts: 0, seguidores: 0, seguindo: 5 },
        });
        mockGetUserPosts.mockResolvedValue([]);
    });

    it("no próprio perfil exibe seguindo = followingIds.size, não o stats stale", async () => {
        mockFollowingIds.delete(20); // simulou unfollow: resta 1
        const view = render(
            <ThemeProvider>
                <ProfileScreen route={{ params: { userId: 1 } }} />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByLabelText("1 seguindo")).toBeTruthy();
        });

        view.unmount();
    });
});
