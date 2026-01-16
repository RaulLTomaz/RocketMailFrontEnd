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

type ListFeedParams = {
    limit?: number;
    offset?: number;
    signal?: AbortSignal;
};

type CreatePostPayload = {
    conteudo: string;
};

export async function listFeed(params?: ListFeedParams): Promise<Post[]> {
    const res = await api.get<Post[]>("/post/feed", {
        params: {
            limit: params?.limit ?? 20,
            offset: params?.offset ?? 0,
        },
        signal: params?.signal,
    });
    return res.data;
}

export async function createPost(
    payload: CreatePostPayload,
    signal?: AbortSignal
): Promise<Post> {
    const res = await api.post<Post>("/post/", payload, {
        signal,
    });
    return res.data;
}
