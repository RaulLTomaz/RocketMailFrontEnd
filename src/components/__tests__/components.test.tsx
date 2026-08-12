import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "../../theme/ThemeContext";
import Button from "../ui/Button";
import ThemeToggle from "../ThemeToggle";
import Avatar from "../Avatar";
import PostCard from "../PostCard";
import type { PostWithLikes } from "../../api/posts";

jest.mock("../../api/likes", () => ({
    likePost: jest.fn(async () => ({ liked: true, post_id: 1 })),
    unlikePost: jest.fn(async () => ({ liked: false, post_id: 1 })),
}));

jest.mock("../../api/comments", () => ({
    listComments: jest.fn(async () => []),
    createComment: jest.fn(),
    deleteComment: jest.fn(),
}));

jest.mock("../../api/posts", () => ({
    deletePost: jest.fn(async () => ({ deleted: true, id: 1 })),
}));

function wrap(ui: React.ReactElement) {
    return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("UI components", () => {
    it("Button primary dispara onPress", () => {
        const onPress = jest.fn();
        wrap(<Button title="Entrar" onPress={onPress} />);
        fireEvent.press(screen.getByRole("button", { name: "Entrar" }));
        expect(onPress).toHaveBeenCalled();
    });

    it("Button disabled não dispara onPress", () => {
        const onPress = jest.fn();
        wrap(<Button title="Entrar" onPress={onPress} disabled />);
        fireEvent.press(screen.getByRole("button", { name: "Entrar" }));
        expect(onPress).not.toHaveBeenCalled();
    });

    it("ThemeToggle alterna rótulo Escuro/Claro", async () => {
        wrap(<ThemeToggle />);
        expect(screen.getByLabelText(/Tema Escuro/i)).toBeTruthy();
        fireEvent.press(screen.getByLabelText(/Tema Escuro/i));
        expect(await screen.findByLabelText(/Tema Claro/i)).toBeTruthy();
    });

    it("Avatar mostra iniciais sem foto", () => {
        wrap(<Avatar nome="Ana Silva" />);
        expect(screen.getByLabelText("Avatar de Ana Silva")).toBeTruthy();
        expect(screen.getByText("AS")).toBeTruthy();
    });

    it("PostCard renderiza autor, texto e curtida", () => {
        const item: PostWithLikes = {
            id: 1,
            post: "Olá mundo",
            data_criacao: "2026-01-01T12:00:00Z",
            usuario: { id: 9, nome: "Bob", foto_url: null },
            likeCount: 3,
            likedByMe: false,
        };
        wrap(
            <PostCard
                item={item}
                currentUserId={1}
                onPressAuthor={jest.fn()}
                onLikeChange={jest.fn()}
            />
        );
        expect(screen.getByText("Bob")).toBeTruthy();
        expect(screen.getByText("Olá mundo")).toBeTruthy();
        expect(screen.getByText(/♡ 3/)).toBeTruthy();
        expect(screen.getByLabelText("Abrir comentários")).toBeTruthy();
    });

    it("PostCard mostra Excluir quando o post é do usuário atual", () => {
        const item: PostWithLikes = {
            id: 1,
            post: "meu post",
            data_criacao: "2026-01-01T12:00:00Z",
            usuario: { id: 1, nome: "Eu", foto_url: null },
            likeCount: 0,
            likedByMe: false,
        };
        wrap(<PostCard item={item} currentUserId={1} />);
        expect(screen.getByText("Excluir")).toBeTruthy();
    });
});
