import React from "react";
import { Text, Pressable } from "react-native";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react-native";
import { AuthProvider, useAuth } from "../../context/AuthContext";

jest.mock("../../api/auth", () => ({
    login: jest.fn(),
    signup: jest.fn(),
    me: jest.fn(),
}));

jest.mock("../../api/follow", () => ({
    listSeguidos: jest.fn(async () => []),
    followUser: jest.fn(async () => ({ seguidor_id: 1, seguido_id: 2 })),
    unfollowUser: jest.fn(async () => ({
        deleted: true,
        seguidor_id: 1,
        seguido_id: 2,
    })),
}));

jest.mock("../../utils/storage", () => ({
    getToken: jest.fn(async () => null),
    saveToken: jest.fn(async () => undefined),
    clearToken: jest.fn(async () => undefined),
}));

jest.mock("../../api/client", () => ({
    setUnauthorizedHandler: jest.fn(),
}));

import { login, signup, me } from "../../api/auth";
import { followUser, unfollowUser, listSeguidos } from "../../api/follow";
import { saveToken, clearToken, getToken } from "../../utils/storage";

const mockedLogin = login as jest.Mock;
const mockedSignup = signup as jest.Mock;
const mockedMe = me as jest.Mock;
const mockedGetToken = getToken as jest.Mock;
const mockedListSeguidos = listSeguidos as jest.Mock;

function AuthProbe() {
    const auth = useAuth();
    if (auth.loading) return <Text>loading</Text>;
    return (
        <>
            <Text testID="user">{auth.user ? auth.user.nome : "none"}</Text>
            <Text testID="following">{auth.isFollowing(2) ? "yes" : "no"}</Text>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="signin"
                onPress={() => {
                    void auth.signIn({ email: "a@b.com", senha: "Senha@123" });
                }}
            >
                <Text>signin</Text>
            </Pressable>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="signup"
                onPress={() => {
                    void auth.signUp({
                        nome: "Ana",
                        email: "a@b.com",
                        senha: "Senha@123",
                    });
                }}
            >
                <Text>signup</Text>
            </Pressable>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="signout"
                onPress={() => {
                    void auth.signOut();
                }}
            >
                <Text>signout</Text>
            </Pressable>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="follow"
                onPress={() => {
                    void auth.follow(2);
                }}
            >
                <Text>follow</Text>
            </Pressable>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="unfollow"
                onPress={() => {
                    void auth.unfollow(2);
                }}
            >
                <Text>unfollow</Text>
            </Pressable>
        </>
    );
}

describe("AuthProvider", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetToken.mockResolvedValue(null);
        mockedListSeguidos.mockResolvedValue([]);
    });

    it("fica sem usuário quando não há token", async () => {
        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>
        );
        await waitFor(() => {
            expect(screen.getByTestId("user").props.children).toBe("none");
        });
    });

    it("hidrata usuário a partir do token", async () => {
        mockedGetToken.mockResolvedValue("tok");
        mockedMe.mockResolvedValue({
            id: 1,
            nome: "Ana",
            email: "a@b.com",
            foto_url: null,
        });
        mockedListSeguidos.mockResolvedValue([{ id: 2, nome: "Bob", email: "b@b.com" }]);

        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("user").props.children).toBe("Ana");
        });
        expect(screen.getByTestId("following").props.children).toBe("yes");
    });

    it("signIn salva token e carrega me", async () => {
        mockedLogin.mockResolvedValue({ access_token: "abc", token_type: "bearer" });
        mockedMe.mockResolvedValue({
            id: 1,
            nome: "Ana",
            email: "a@b.com",
        });

        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>
        );
        await waitFor(() => screen.getByTestId("user"));

        await act(async () => {
            fireEvent.press(screen.getByLabelText("signin"));
        });

        await waitFor(() => {
            expect(screen.getByTestId("user").props.children).toBe("Ana");
        });
        expect(saveToken).toHaveBeenCalledWith("abc");
        expect(mockedLogin).toHaveBeenCalled();
    });

    it("signUp cadastra, loga e hidrata", async () => {
        mockedSignup.mockResolvedValue({ id: 1, nome: "Ana", email: "a@b.com" });
        mockedLogin.mockResolvedValue({ access_token: "xyz", token_type: "bearer" });
        mockedMe.mockResolvedValue({ id: 1, nome: "Ana", email: "a@b.com" });

        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>
        );
        await waitFor(() => screen.getByTestId("user"));

        await act(async () => {
            fireEvent.press(screen.getByLabelText("signup"));
        });

        await waitFor(() => {
            expect(screen.getByTestId("user").props.children).toBe("Ana");
        });
        expect(mockedSignup).toHaveBeenCalled();
        expect(saveToken).toHaveBeenCalledWith("xyz");
    });

    it("signOut limpa token e usuário", async () => {
        mockedGetToken.mockResolvedValue("tok");
        mockedMe.mockResolvedValue({ id: 1, nome: "Ana", email: "a@b.com" });

        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>
        );
        await waitFor(() => {
            expect(screen.getByTestId("user").props.children).toBe("Ana");
        });

        await act(async () => {
            fireEvent.press(screen.getByLabelText("signout"));
        });

        await waitFor(() => {
            expect(screen.getByTestId("user").props.children).toBe("none");
        });
        expect(clearToken).toHaveBeenCalled();
    });

    it("follow e unfollow atualizam isFollowing", async () => {
        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>
        );
        await waitFor(() => screen.getByTestId("following"));

        await act(async () => {
            fireEvent.press(screen.getByLabelText("follow"));
        });
        await waitFor(() => {
            expect(screen.getByTestId("following").props.children).toBe("yes");
        });
        expect(followUser).toHaveBeenCalledWith(2);

        await act(async () => {
            fireEvent.press(screen.getByLabelText("unfollow"));
        });
        await waitFor(() => {
            expect(screen.getByTestId("following").props.children).toBe("no");
        });
        expect(unfollowUser).toHaveBeenCalledWith(2);
    });
});
