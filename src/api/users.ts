import { api } from "./client";
import type { Post } from "./posts";

export type UsuarioOut = {
    id: number;
    nome: string;
    email: string;
};

export type PerfilStats = {
    usuario: UsuarioOut;
    stats: {
        posts: number;
        seguidores: number;
        seguindo: number;
    };
};

export type UsuarioUpdate = {
    nome?: string;
    email?: string;
    senha?: string;
};

export async function getUser(id: number): Promise<UsuarioOut> {
    const res = await api.get<UsuarioOut>(`/usuario/${id}`);
    return res.data;
}

export async function getUserStats(id: number): Promise<PerfilStats> {
    const res = await api.get<PerfilStats>(`/usuario/${id}/stats`);
    return res.data;
}

export async function getUserPosts(
    id: number,
    params?: { limit?: number; offset?: number; signal?: AbortSignal }
): Promise<Post[]> {
    const res = await api.get<Post[]>(`/usuario/${id}/posts`, {
        params: {
            limit: params?.limit ?? 20,
            offset: params?.offset ?? 0,
        },
        signal: params?.signal,
    });
    return res.data;
}

export async function updateMe(payload: UsuarioUpdate): Promise<UsuarioOut> {
    const res = await api.patch<UsuarioOut>("/usuario/me", payload);
    return res.data;
}

export async function deleteMe(): Promise<{ deleted: boolean }> {
    const res = await api.delete<{ deleted: boolean }>("/usuario/me");
    return res.data;
}
