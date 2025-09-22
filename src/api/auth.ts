import { api } from "./client";

export type LoginPayload = {
    email: string;
    senha: string;
};

export type LoginResponse = {
    access_token: string;
    token_type: string;
};

export type SignupPayload = {
    nome: string;
    email: string;
    senha: string;
};

export type UsuarioOut = {
    id: number;
    nome: string;
    email: string;
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
    const form = new URLSearchParams();
    form.append("username", payload.email);
    form.append("password", payload.senha);
    const res = await api.post<LoginResponse>("/usuario/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return res.data;
}

export async function signup(payload: SignupPayload): Promise<UsuarioOut> {
    const res = await api.post<UsuarioOut>("/usuario/", payload);
    return res.data;
}

export async function me(): Promise<UsuarioOut> {
    const res = await api.get<UsuarioOut>("/usuario/me");
    return res.data;
}
