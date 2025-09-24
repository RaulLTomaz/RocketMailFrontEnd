import { api } from "./client";

export type Post = {
    id: number;
    conteudo: string;
    usuario_id: number;
    criado_em?: string;
    usuario?: {
        id: number;
        nome: string;
        email: string;
    };
};

export async function listFeed(params?: { limit?: number; offset?: number }): Promise<Post[]> {
    const res = await api.get<Post[]>("/post/feed", {
        params: {
            limit: params?.limit ?? 20,
            offset: params?.offset ?? 0,
        },
    });
    return res.data;
}

export async function createPost(payload: { conteudo: string }): Promise<Post> {
    const res = await api.post<Post>("/post/", payload);
    return res.data;
}
