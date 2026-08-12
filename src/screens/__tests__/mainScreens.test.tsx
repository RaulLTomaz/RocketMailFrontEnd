import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "../../theme/ThemeContext";

jest.mock("../../api/client", () => ({
    api: {
        get: jest.fn(async () => ({ data: [] })),
        post: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
    },
    setUnauthorizedHandler: jest.fn(),
}));

jest.mock("../../api/posts", () => ({
    listPosts: jest.fn(async () => []),
    listFeed: jest.fn(async () => []),
    createPost: jest.fn(),
    deletePost: jest.fn(),
}));

jest.mock("../../api/attachLikes", () => ({
    attachLikes: jest.fn(async (posts: unknown[]) => posts),
}));

jest.mock("../../api/users", () => ({
    searchUsers: jest.fn(async () => []),
}));

jest.mock("../../images/FAVICON.png", () => 1);

jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ navigate: jest.fn(), push: jest.fn() }),
}));

jest.mock("../../context/AuthContext", () => ({
    useAuth: () => ({
        user: { id: 1, nome: "Ana", email: "a@b.com", foto_url: null },
        loading: false,
        signOut: jest.fn(async () => undefined),
        followingIds: new Set(),
        isFollowing: () => false,
        follow: jest.fn(),
        unfollow: jest.fn(),
        refreshFollowing: jest.fn(),
        signIn: jest.fn(),
        signUp: jest.fn(),
        setUser: jest.fn(),
    }),
}));

import ExploreScreen from "../ExploreScreen";

describe("Main screens", () => {
    it("Procurar mostra título e campo de busca", async () => {
        const view = render(
            <ThemeProvider>
                <ExploreScreen />
            </ThemeProvider>
        );
        expect(await screen.findByText("Procurar")).toBeTruthy();
        expect(screen.getByPlaceholderText("Buscar usuários por nome…")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Sair" })).toBeTruthy();
        view.unmount();
    });
});
