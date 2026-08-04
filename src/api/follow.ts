import { api } from "./client";
import type { UsuarioOut } from "./users";

export async function followUser(seguidoId: number): Promise<{
    seguidor_id: number;
    seguido_id: number;
}> {
    const res = await api.post("/seguir/", null, {
        params: { seguido_id: seguidoId },
    });
    return res.data;
}

export async function unfollowUser(seguidoId: number): Promise<{
    deleted: boolean;
    seguidor_id: number;
    seguido_id: number;
}> {
    const res = await api.delete("/seguir/", {
        params: { seguido_id: seguidoId },
    });
    return res.data;
}

export async function listSeguidos(): Promise<UsuarioOut[]> {
    const res = await api.get<UsuarioOut[]>("/seguir/seguidos");
    return res.data;
}
