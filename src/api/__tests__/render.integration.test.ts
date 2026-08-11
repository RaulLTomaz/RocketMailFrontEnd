/**
 * Integração real com a API no Render.
 * Valida round-trip dos endpoints usados pelo app.
 *
 * Rodar: npm run test:integration
 */

jest.unmock("axios");

const tokenStore: { value: string | null } = { value: null };

jest.mock("../../utils/storage", () => ({
    saveToken: jest.fn(async (token: string) => {
        tokenStore.value = token;
    }),
    getToken: jest.fn(async () => tokenStore.value),
    clearToken: jest.fn(async () => {
        tokenStore.value = null;
    }),
}));

import axios from "axios";
import { api } from "../client";
import { login, signup, me } from "../auth";
import { saveToken, clearToken } from "../../utils/storage";
import {
    createPost,
    deletePost,
    listFeed,
    listPosts,
} from "../posts";
import {
    getUser,
    getUserStats,
    getUserPosts,
    updateMe,
    deleteMe,
    searchUsers,
} from "../users";
import { getLikesBatch, likePost, unlikePost } from "../likes";
import { followUser, unfollowUser, listSeguidos } from "../follow";
import { attachLikes } from "../attachLikes";

const API_URL = "https://rocketmail-django.onrender.com";

function uniqueEmail(prefix: string) {
    return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@gmail.com`;
}

async function authAs(email: string, senha: string, nome: string) {
    await clearToken();
    try {
        await signup({ nome, email, senha });
    } catch (e: any) {
        const status = e?.response?.status;
        if (status !== 409) {
            const detail = e?.response?.data?.detail ?? e?.message;
            throw new Error(
                `Falha no signup (${status ?? "sem status"}): ${JSON.stringify(detail)}`
            );
        }
    }
    const tok = await login({ email, senha });
    await saveToken(tok.access_token);
    return me();
}

describe("Render API integration (envio + recebimento)", () => {
    // Mesmas regras de senha do front (maiúscula, número, símbolo).
    const senha = "Senha@123";
    const createdIds: number[] = [];
    const emailsToCleanup: Array<{ email: string; nome: string }> = [];

    beforeAll(async () => {
        api.defaults.timeout = 120_000;
        api.defaults.baseURL = API_URL;
    }, 30_000);

    afterAll(async () => {
        for (const u of emailsToCleanup) {
            try {
                await authAs(u.email, senha, u.nome);
                for (const id of createdIds) {
                    try {
                        await deletePost(id);
                    } catch {}
                }
                await deleteMe();
            } catch {}
        }
        await clearToken();
    }, 180_000);

    it(
        "GET /healthz — recebe status ok do Render",
        async () => {
            const res = await axios.get(`${API_URL}/healthz`, {
                timeout: 120_000,
            });
            expect(res.status).toBe(200);
            expect(res.data).toEqual({ status: "ok" });
        },
        130_000
    );

    it(
        "POST /usuario/ — envia payload e recebe resposta JSON (sucesso ou erro estruturado)",
        async () => {
            const email = uniqueEmail("probe");
            try {
                const created = await signup({
                    nome: "Probe User",
                    email,
                    senha,
                });
                expect(created.id).toEqual(expect.any(Number));
                emailsToCleanup.push({ email, nome: "Probe User" });
                const tok = await login({ email, senha });
                await saveToken(tok.access_token);
                await deleteMe();
                await clearToken();
                emailsToCleanup.pop();
            } catch (e: any) {
                // Aceita erro estruturado da API (prova de conectividade).
                expect(e.response).toBeDefined();
                expect(typeof e.response.status).toBe("number");
                expect(e.response.data?.detail).toBeDefined();
            }
        },
        180_000
    );

    it(
        "fluxo autenticado completo — envia e recebe em auth/posts/likes/seguir/perfil",
        async () => {
            const emailA = uniqueEmail("usera");
            const emailB = uniqueEmail("userb");

            let userA;
            let userB;
            try {
                userA = await authAs(emailA, senha, "User A Test");
                emailsToCleanup.push({ email: emailA, nome: "User A Test" });
                userB = await authAs(emailB, senha, "User B Test");
                emailsToCleanup.push({ email: emailB, nome: "User B Test" });
            } catch (e: any) {
                throw new Error(
                    `Signup/login no Render falhou. Detalhe: ${e?.message ?? e}`
                );
            }

            userA = await authAs(emailA, senha, "User A Test");

            const texto = `post integração ${Date.now()}`;
            const created = await createPost({ post: texto });
            createdIds.push(created.id);
            expect(created).toMatchObject({
                id: expect.any(Number),
                post: texto,
                usuario: { id: userA.id },
            });
            expect(created.data_criacao).toBeTruthy();

            const feed = await listFeed({ limit: 20, offset: 0 });
            expect(feed.some((p) => p.id === created.id)).toBe(true);

            const explore = await listPosts({ limit: 20, offset: 0 });
            expect(explore.some((p) => p.id === created.id)).toBe(true);

            const mine = await getUserPosts(userA.id, { limit: 20, offset: 0 });
            expect(mine.some((p) => p.id === created.id)).toBe(true);

            expect((await getUser(userA.id)).id).toBe(userA.id);
            expect((await getUserStats(userA.id)).stats.posts).toBeGreaterThanOrEqual(1);

            try {
                const hits = await searchUsers({
                    q: "User A",
                    limit: 10,
                    postsPerUser: 3,
                });
                expect(Array.isArray(hits)).toBe(true);
                expect(hits.some((h) => h.usuario.id === userA.id)).toBe(true);
                const meHit = hits.find((h) => h.usuario.id === userA.id);
                expect(meHit?.posts.some((p) => p.id === created.id)).toBe(true);
            } catch (e: any) {
                if (e?.response?.status === 404) {
                    // Limitação: endpoint pode ainda não estar no deploy.
                    console.warn(
                        "[integration] GET /usuario/search ainda não disponível (404). Pule até o backend publicar."
                    );
                } else {
                    throw e;
                }
            }

            expect(await likePost(created.id)).toMatchObject({
                liked: true,
                post_id: created.id,
            });
            const batch = await getLikesBatch([created.id]);
            const info = batch[String(created.id)] ?? (batch as any)[created.id];
            expect(info.liked_by_me).toBe(true);

            const withLikes = await attachLikes([created]);
            expect(withLikes[0].likedByMe).toBe(true);

            expect(await unlikePost(created.id)).toMatchObject({
                liked: false,
                post_id: created.id,
            });

            expect(await followUser(userB.id)).toMatchObject({
                seguidor_id: userA.id,
                seguido_id: userB.id,
            });
            expect((await listSeguidos()).some((u) => u.id === userB.id)).toBe(true);
            await unfollowUser(userB.id);
            expect((await listSeguidos()).some((u) => u.id === userB.id)).toBe(false);

            const novoNome = `User A ${Date.now()}`;
            expect((await updateMe({ nome: novoNome })).nome).toBe(novoNome);
            expect((await me()).nome).toBe(novoNome);
            emailsToCleanup[0].nome = novoNome;

            expect(await deletePost(created.id)).toMatchObject({
                deleted: true,
                id: created.id,
            });
            expect(
                (await getUserPosts(userA.id, { limit: 50, offset: 0 })).some(
                    (p) => p.id === created.id
                )
            ).toBe(false);
            createdIds.length = 0;
        },
        300_000
    );
});
