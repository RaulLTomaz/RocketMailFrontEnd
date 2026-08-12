import { api } from "./client";
import type { UsuarioSimples } from "./posts";

export type Comentario = {
    id: number;
    comentario: string;
    data_criacao: string;
    post_id: number;
    usuario: UsuarioSimples;
};

export type CreateComentarioPayload = {
    comentario: string;
};

export async function listComments(
    postId: number,
    params?: { limit?: number; offset?: number; signal?: AbortSignal }
): Promise<Comentario[]> {
    const res = await api.get<Comentario[]>(`/comentario/post/${postId}`, {
        params: {
            limit: params?.limit ?? 50,
            offset: params?.offset ?? 0,
        },
        signal: params?.signal,
    });
    return res.data;
}

export async function createComment(
    postId: number,
    payload: CreateComentarioPayload
): Promise<Comentario> {
    const res = await api.post<Comentario>(`/comentario/post/${postId}`, {
        comentario: payload.comentario,
    });
    return res.data;
}

export async function deleteComment(
    comentarioId: number
): Promise<{ deleted: boolean; id: number }> {
    const res = await api.delete<{ deleted: boolean; id: number }>(
        `/comentario/${comentarioId}`
    );
    return res.data;
}
