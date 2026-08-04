import { api } from "./client";

export type UsuarioSimples = {
    id: number;
    nome: string;
};

export type Post = {
    id: number;
    post: string;
    data_criacao: string;
    usuario: UsuarioSimples;
};

/** Post com metadados de like mesclados no client */
export type PostWithLikes = Post & {
    likeCount: number;
    likedByMe: boolean;
};

type ListParams = {
    limit?: number;
    offset?: number;
    signal?: AbortSignal;
};

type CreatePostPayload = {
    post: string;
};

export async function listFeed(params?: ListParams): Promise<Post[]> {
    const res = await api.get<Post[]>("/post/feed", {
        params: {
            limit: params?.limit ?? 20,
            offset: params?.offset ?? 0,
        },
        signal: params?.signal,
    });
    return res.data;
}

export async function listPosts(params?: ListParams & { sort?: string }): Promise<Post[]> {
    const res = await api.get<Post[]>("/post/", {
        params: {
            limit: params?.limit ?? 20,
            offset: params?.offset ?? 0,
            sort: params?.sort ?? "-data",
        },
        signal: params?.signal,
    });
    return res.data;
}

export async function createPost(
    payload: CreatePostPayload,
    signal?: AbortSignal
): Promise<Post> {
    const res = await api.post<Post>("/post/", payload, { signal });
    return res.data;
}

export async function deletePost(postId: number): Promise<{ deleted: boolean; id: number }> {
    const res = await api.delete<{ deleted: boolean; id: number }>(`/post/${postId}`);
    return res.data;
}
