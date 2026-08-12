import { api } from "../client";
import { login, signup, me } from "../auth";
import {
    listFeed,
    listPosts,
    createPost,
    deletePost,
} from "../posts";
import {
    getUser,
    getUserStats,
    getUserPosts,
    updateMe,
    deleteMe,
    searchUsers,
    deleteFoto,
    uploadFoto,
} from "../users";
import { likePost, unlikePost, getLikesBatch } from "../likes";
import { followUser, unfollowUser, listSeguidos, listSeguidores } from "../follow";
import { listComments, createComment, deleteComment } from "../comments";

jest.mock("../client", () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
    },
}));

const mockedApi = api as unknown as {
    get: jest.Mock;
    post: jest.Mock;
    patch: jest.Mock;
    delete: jest.Mock;
};

describe("API clients (unit / mocked)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("auth", () => {
        it("login envia form-urlencoded com username/password", async () => {
            mockedApi.post.mockResolvedValue({
                data: { access_token: "tok", token_type: "bearer" },
            });

            const data = await login({ email: "a@b.com", senha: "123456" });

            expect(data.access_token).toBe("tok");
            expect(mockedApi.post).toHaveBeenCalledWith(
                "/usuario/login",
                expect.stringContaining("username=a%40b.com"),
                expect.objectContaining({
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                })
            );
            expect(mockedApi.post.mock.calls[0][1]).toContain("password=123456");
        });

        it("signup envia JSON e devolve usuário", async () => {
            mockedApi.post.mockResolvedValue({
                data: { id: 1, nome: "Ana", email: "a@b.com" },
            });
            const u = await signup({
                nome: "Ana",
                email: "a@b.com",
                senha: "123456",
            });
            expect(u.id).toBe(1);
            expect(mockedApi.post).toHaveBeenCalledWith("/usuario/", {
                nome: "Ana",
                email: "a@b.com",
                senha: "123456",
            });
        });

        it("me busca /usuario/me", async () => {
            mockedApi.get.mockResolvedValue({
                data: { id: 1, nome: "Ana", email: "a@b.com" },
            });
            await expect(me()).resolves.toMatchObject({ id: 1 });
            expect(mockedApi.get).toHaveBeenCalledWith("/usuario/me");
        });
    });

    describe("posts", () => {
        it("listFeed passa limit/offset", async () => {
            mockedApi.get.mockResolvedValue({ data: [] });
            await listFeed({ limit: 10, offset: 5 });
            expect(mockedApi.get).toHaveBeenCalledWith(
                "/post/feed",
                expect.objectContaining({
                    params: { limit: 10, offset: 5 },
                })
            );
        });

        it("listPosts usa sort padrão -data", async () => {
            mockedApi.get.mockResolvedValue({ data: [] });
            await listPosts();
            expect(mockedApi.get).toHaveBeenCalledWith(
                "/post/",
                expect.objectContaining({
                    params: { limit: 20, offset: 0, sort: "-data" },
                })
            );
        });

        it("createPost envia { post }", async () => {
            mockedApi.post.mockResolvedValue({
                data: {
                    id: 9,
                    post: "oi",
                    data_criacao: "2026-01-01",
                    usuario: { id: 1, nome: "Ana" },
                },
            });
            const p = await createPost({ post: "oi" });
            expect(p.post).toBe("oi");
            expect(mockedApi.post).toHaveBeenCalledWith(
                "/post/",
                { post: "oi" },
                expect.any(Object)
            );
        });

        it("deletePost chama DELETE /post/:id", async () => {
            mockedApi.delete.mockResolvedValue({
                data: { deleted: true, id: 9 },
            });
            await expect(deletePost(9)).resolves.toEqual({
                deleted: true,
                id: 9,
            });
            expect(mockedApi.delete).toHaveBeenCalledWith("/post/9");
        });
    });

    describe("users", () => {
        it("getUser / getUserStats / getUserPosts", async () => {
            mockedApi.get
                .mockResolvedValueOnce({
                    data: { id: 2, nome: "Bob", email: "b@b.com" },
                })
                .mockResolvedValueOnce({
                    data: {
                        usuario: { id: 2, nome: "Bob", email: "b@b.com" },
                        stats: { posts: 1, seguidores: 0, seguindo: 0 },
                    },
                })
                .mockResolvedValueOnce({ data: [] });

            await getUser(2);
            await getUserStats(2);
            await getUserPosts(2, { limit: 5, offset: 0 });

            expect(mockedApi.get).toHaveBeenNthCalledWith(1, "/usuario/2");
            expect(mockedApi.get).toHaveBeenNthCalledWith(2, "/usuario/2/stats");
            expect(mockedApi.get).toHaveBeenNthCalledWith(
                3,
                "/usuario/2/posts",
                expect.objectContaining({ params: { limit: 5, offset: 0 } })
            );
        });

        it("updateMe e deleteMe", async () => {
            mockedApi.patch.mockResolvedValue({
                data: { id: 1, nome: "Nova", email: "a@b.com" },
            });
            mockedApi.delete.mockResolvedValue({ data: { deleted: true } });

            await updateMe({ nome: "Nova" });
            await deleteMe();

            expect(mockedApi.patch).toHaveBeenCalledWith("/usuario/me", {
                nome: "Nova",
            });
            expect(mockedApi.delete).toHaveBeenCalledWith("/usuario/me");
        });

        it("searchUsers chama /usuario/search com q e limites", async () => {
            mockedApi.get.mockResolvedValue({
                data: [
                    {
                        usuario: {
                            id: 2,
                            nome: "Bob",
                            email: "b@b.com",
                            foto_url: null,
                        },
                        posts: [],
                    },
                ],
            });

            const hits = await searchUsers({
                q: "bob",
                limit: 10,
                postsPerUser: 3,
            });

            expect(hits).toHaveLength(1);
            expect(hits[0].usuario.nome).toBe("Bob");
            expect(mockedApi.get).toHaveBeenCalledWith(
                "/usuario/search",
                expect.objectContaining({
                    params: {
                        q: "bob",
                        limit: 10,
                        posts_per_user: 3,
                    },
                })
            );
        });

        it("searchUsers usa defaults limit=20 e posts_per_user=5", async () => {
            mockedApi.get.mockResolvedValue({ data: [] });
            await searchUsers({ q: "ana" });
            expect(mockedApi.get).toHaveBeenCalledWith(
                "/usuario/search",
                expect.objectContaining({
                    params: { q: "ana", limit: 20, posts_per_user: 5 },
                })
            );
        });

        it("deleteFoto chama DELETE /usuario/me/foto", async () => {
            mockedApi.delete.mockResolvedValue({
                data: { id: 1, nome: "Ana", email: "a@b.com", foto_url: null },
            });
            const u = await deleteFoto();
            expect(u.foto_url).toBeNull();
            expect(mockedApi.delete).toHaveBeenCalledWith("/usuario/me/foto");
        });

        it("uploadFoto envia multipart POST /usuario/me/foto", async () => {
            const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
            const blob = new Blob([png], { type: "image/png" });
            global.fetch = jest.fn().mockResolvedValue({
                blob: async () => blob,
            }) as any;

            mockedApi.post.mockResolvedValue({
                data: {
                    id: 1,
                    nome: "Ana",
                    email: "a@b.com",
                    foto_url: "https://res.cloudinary.com/demo/avatar.png",
                },
            });

            const updated = await uploadFoto({
                uri: "blob:http://localhost/fake",
                name: "avatar.png",
                type: "image/png",
            });

            expect(updated.foto_url).toContain("cloudinary");
            expect(mockedApi.post).toHaveBeenCalledWith(
                "/usuario/me/foto",
                expect.any(FormData),
                expect.objectContaining({
                    timeout: 90_000,
                })
            );
            const form = mockedApi.post.mock.calls[0][1] as FormData;
            expect(form).toBeInstanceOf(FormData);
        });
    });

    describe("likes", () => {
        it("getLikesBatch retorna {} sem IDs", async () => {
            await expect(getLikesBatch([])).resolves.toEqual({});
            expect(mockedApi.get).not.toHaveBeenCalled();
        });

        it("like/unlike e batch", async () => {
            mockedApi.post.mockResolvedValue({
                data: { liked: true, post_id: 1 },
            });
            mockedApi.delete.mockResolvedValue({
                data: { liked: false, post_id: 1 },
            });
            mockedApi.get.mockResolvedValue({
                data: { "1": { post_id: 1, count: 1, liked_by_me: true } },
            });

            await likePost(1);
            await unlikePost(1);
            await getLikesBatch([1, 2]);

            expect(mockedApi.post).toHaveBeenCalledWith("/like/1");
            expect(mockedApi.delete).toHaveBeenCalledWith("/like/1");
            expect(mockedApi.get).toHaveBeenCalledWith(
                "/like/batch",
                expect.objectContaining({
                    params: { post_ids: [1, 2] },
                })
            );
        });
    });

    describe("follow", () => {
        it("follow/unfollow via query seguido_id e lista seguidos/seguidores", async () => {
            mockedApi.post.mockResolvedValue({
                data: { seguidor_id: 1, seguido_id: 2 },
            });
            mockedApi.delete.mockResolvedValue({
                data: { deleted: true, seguidor_id: 1, seguido_id: 2 },
            });
            mockedApi.get.mockResolvedValue({
                data: [{ id: 2, nome: "Bob", email: "b@b.com" }],
            });

            await followUser(2);
            await unfollowUser(2);
            await listSeguidos();
            await listSeguidores();

            expect(mockedApi.post).toHaveBeenCalledWith(
                "/seguir/",
                null,
                expect.objectContaining({ params: { seguido_id: 2 } })
            );
            expect(mockedApi.delete).toHaveBeenCalledWith(
                "/seguir/",
                expect.objectContaining({ params: { seguido_id: 2 } })
            );
            expect(mockedApi.get).toHaveBeenCalledWith("/seguir/seguidos");
            expect(mockedApi.get).toHaveBeenCalledWith("/seguir/seguidores");
        });
    });

    describe("comments", () => {
        it("lista, cria e exclui comentário", async () => {
            mockedApi.get.mockResolvedValue({
                data: [
                    {
                        id: 1,
                        comentario: "oi",
                        data_criacao: "2026-01-01T00:00:00Z",
                        post_id: 9,
                        usuario: { id: 1, nome: "Ana", foto_url: null },
                    },
                ],
            });
            mockedApi.post.mockResolvedValue({
                data: {
                    id: 2,
                    comentario: "novo",
                    data_criacao: "2026-01-01T00:00:00Z",
                    post_id: 9,
                    usuario: { id: 1, nome: "Ana", foto_url: null },
                },
            });
            mockedApi.delete.mockResolvedValue({
                data: { deleted: true, id: 2 },
            });

            await listComments(9);
            await createComment(9, { comentario: "novo" });
            await deleteComment(2);

            expect(mockedApi.get).toHaveBeenCalledWith(
                "/comentario/post/9",
                expect.objectContaining({
                    params: { limit: 50, offset: 0 },
                })
            );
            expect(mockedApi.post).toHaveBeenCalledWith("/comentario/post/9", {
                comentario: "novo",
            });
            expect(mockedApi.delete).toHaveBeenCalledWith("/comentario/2");
        });
    });
});
