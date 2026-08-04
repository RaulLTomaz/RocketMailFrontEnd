import { api } from "./client";
import type { Post } from "./posts";

export type UsuarioOut = {
    id: number;
    nome: string;
    email: string;
    /** Presente quando o backend expuser foto de perfil */
    foto_url?: string | null;
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
    foto_url?: string | null;
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

export type UploadFotoInput = {
    uri: string;
    name?: string;
    type?: string;
};

/** POST multipart /usuario/me/foto — campo `file`. */
export async function uploadFoto(file: UploadFotoInput): Promise<UsuarioOut> {
    const form = new FormData();
    const name = file.name || guessName(file.uri, file.type);
    const type = file.type || guessMime(file.uri);

    if (
        file.uri.startsWith("blob:") ||
        file.uri.startsWith("data:") ||
        /^https?:\/\//i.test(file.uri)
    ) {
        const blob = await fetch(file.uri).then((r) => r.blob());
        form.append("file", blob, name);
    } else {
        form.append("file", {
            uri: file.uri,
            name,
            type,
        } as unknown as Blob);
    }

    const res = await api.post<UsuarioOut>("/usuario/me/foto", form, {
        timeout: 60_000,
        transformRequest: [
            (data, headers) => {
                if (typeof FormData !== "undefined" && data instanceof FormData) {
                    const h = headers as { delete?: (k: string) => void } & Record<
                        string,
                        unknown
                    >;
                    if (typeof h?.delete === "function") {
                        h.delete("Content-Type");
                    } else if (h) {
                        delete h["Content-Type"];
                    }
                }
                return data;
            },
        ],
    });
    return res.data;
}

export async function deleteFoto(): Promise<UsuarioOut> {
    const res = await api.delete<UsuarioOut>("/usuario/me/foto");
    return res.data;
}

function guessMime(uri: string): string {
    const lower = uri.toLowerCase();
    if (lower.includes(".png")) return "image/png";
    if (lower.includes(".webp")) return "image/webp";
    return "image/jpeg";
}

function guessName(uri: string, type?: string): string {
    const mime = type || guessMime(uri);
    const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
    return `avatar.${ext}`;
}
