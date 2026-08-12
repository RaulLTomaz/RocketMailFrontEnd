import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { ThemeProvider } from "../../theme/ThemeContext";
import LoginScreen from "../LoginScreen";
import SignupScreen from "../SignupScreen";

const mockSignIn = jest.fn(async () => undefined);
const mockSignUp = jest.fn(async () => undefined);

jest.mock("../../context/AuthContext", () => ({
    useAuth: () => ({
        user: null,
        loading: false,
        signIn: mockSignIn,
        signUp: mockSignUp,
        signOut: jest.fn(),
        setUser: jest.fn(),
        followingIds: new Set(),
        isFollowing: () => false,
        follow: jest.fn(),
        unfollow: jest.fn(),
        refreshFollowing: jest.fn(),
    }),
}));

jest.mock("../../images/logo.png", () => 1);

function wrap(ui: React.ReactElement) {
    return render(<ThemeProvider>{ui}</ThemeProvider>);
}

const nav = { navigate: jest.fn() } as any;

describe("Auth screens", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("LoginScreen mostra marca e formulário", () => {
        wrap(<LoginScreen navigation={nav} />);
        expect(screen.getByText("RocketMail")).toBeTruthy();
        expect(screen.getByPlaceholderText("E-mail")).toBeTruthy();
        expect(screen.getByPlaceholderText("Senha")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Entrar" })).toBeTruthy();
    });

    it("LoginScreen bloqueia campos vazios", async () => {
        wrap(<LoginScreen navigation={nav} />);
        fireEvent.press(screen.getByRole("button", { name: "Entrar" }));
        expect(await screen.findByText("Preencha e-mail e senha.")).toBeTruthy();
        expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("LoginScreen chama signIn com e-mail e senha", async () => {
        wrap(<LoginScreen navigation={nav} />);

        fireEvent.changeText(screen.getByPlaceholderText("E-mail"), "A@B.com");
        fireEvent.changeText(screen.getByPlaceholderText("Senha"), "Senha@123");
        fireEvent.press(screen.getByRole("button", { name: "Entrar" }));

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith({
                email: "a@b.com",
                senha: "Senha@123",
            });
        });
    });

    it("LoginScreen mostra erro da API", async () => {
        mockSignIn.mockRejectedValueOnce({
            response: { data: { detail: "Credenciais inválidas" } },
        });
        wrap(<LoginScreen navigation={nav} />);

        fireEvent.changeText(screen.getByPlaceholderText("E-mail"), "a@b.com");
        fireEvent.changeText(screen.getByPlaceholderText("Senha"), "Senha@123");
        fireEvent.press(screen.getByRole("button", { name: "Entrar" }));

        expect(await screen.findByText("Credenciais inválidas")).toBeTruthy();
    });

    it("LoginScreen navega para Signup", () => {
        const navigate = jest.fn();
        wrap(<LoginScreen navigation={{ navigate } as any} />);
        fireEvent.press(screen.getByText("Criar conta"));
        expect(navigate).toHaveBeenCalledWith("Signup");
    });

    it("SignupScreen bloqueia senha fraca", () => {
        wrap(<SignupScreen navigation={nav} />);

        fireEvent.changeText(screen.getByPlaceholderText("Nome"), "Ana");
        fireEvent.changeText(screen.getByPlaceholderText("E-mail"), "a@b.com");
        fireEvent.changeText(screen.getByPlaceholderText("Senha"), "fraca");

        fireEvent.press(screen.getByRole("button", { name: "Criar conta" }));
        expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("SignupScreen cria conta com senha forte", async () => {
        wrap(<SignupScreen navigation={nav} />);

        fireEvent.changeText(screen.getByPlaceholderText("Nome"), "Ana");
        fireEvent.changeText(screen.getByPlaceholderText("E-mail"), "a@b.com");
        fireEvent.changeText(screen.getByPlaceholderText("Senha"), "Senha@123");
        fireEvent.press(screen.getByRole("button", { name: "Criar conta" }));

        await waitFor(() => {
            expect(mockSignUp).toHaveBeenCalledWith({
                nome: "Ana",
                email: "a@b.com",
                senha: "Senha@123",
            });
        });
    });
});
