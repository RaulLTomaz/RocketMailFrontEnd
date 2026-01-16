import { api } from "./client";

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

export type Post = {
    id: number;
    conteudo: string;
    usuario_id: number;
    criado_em?: string;
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
    params?: { limit?: number; offset?: number }
): Promise<Post[]> {
    const res = await api.get<Post[]>(`/usuario/${id}/posts`, {
        params: {
            limit: params?.limit ?? 20,
            offset: params?.offset ?? 0,
        },
    });
    return res.data;
}
