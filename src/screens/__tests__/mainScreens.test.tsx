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

const mockListFeed = jest.fn(async () => [] as unknown[]);
const mockListPosts = jest.fn(async () => [] as unknown[]);

jest.mock("../../api/posts", () => ({
    listPosts: (...args: unknown[]) => mockListPosts(...args),
    listFeed: (...args: unknown[]) => mockListFeed(...args),
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
import HomeScreen from "../HomeScreen";

describe("Main screens", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockListFeed.mockResolvedValue([]);
        mockListPosts.mockResolvedValue([]);
    });

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

    it("Home mostra empty state do feed", async () => {
        render(
            <ThemeProvider>
                <HomeScreen />
            </ThemeProvider>
        );
        expect(await screen.findByText("Nenhum post ainda. Seja o primeiro!")).toBeTruthy();
        expect(screen.getByPlaceholderText("O que está acontecendo?")).toBeTruthy();
        expect(
            screen.getByRole("button", { name: "Postar" }).props.accessibilityState?.disabled
        ).toBe(true);
    });

    it("Home mostra erro inline quando o feed falha", async () => {
        mockListFeed.mockRejectedValue({
            response: { data: { detail: "Serviço indisponível" } },
        });
        render(
            <ThemeProvider>
                <HomeScreen />
            </ThemeProvider>
        );
        expect(await screen.findByText("Serviço indisponível")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeTruthy();
    });
});
