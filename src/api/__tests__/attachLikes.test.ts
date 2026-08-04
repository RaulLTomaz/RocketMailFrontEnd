import { attachLikes } from "../attachLikes";
import { getLikesBatch } from "../likes";
import type { Post } from "../posts";

jest.mock("../likes", () => ({
    getLikesBatch: jest.fn(),
}));

const mockedBatch = getLikesBatch as jest.MockedFunction<typeof getLikesBatch>;

const samplePosts: Post[] = [
    {
        id: 1,
        post: "olá",
        data_criacao: "2026-01-01T00:00:00Z",
        usuario: { id: 10, nome: "Ana" },
    },
    {
        id: 2,
        post: "mundo",
        data_criacao: "2026-01-02T00:00:00Z",
        usuario: { id: 11, nome: "Bob" },
    },
];

describe("attachLikes", () => {
    it("retorna [] sem chamar a API quando não há posts", async () => {
        await expect(attachLikes([])).resolves.toEqual([]);
        expect(mockedBatch).not.toHaveBeenCalled();
    });

    it("mescla count e liked_by_me no post", async () => {
        mockedBatch.mockResolvedValue({
            "1": { post_id: 1, count: 3, liked_by_me: true },
            "2": { post_id: 2, count: 0, liked_by_me: false },
        });

        const result = await attachLikes(samplePosts);

        expect(mockedBatch).toHaveBeenCalledWith([1, 2]);
        expect(result[0]).toMatchObject({
            id: 1,
            likeCount: 3,
            likedByMe: true,
        });
        expect(result[1]).toMatchObject({
            id: 2,
            likeCount: 0,
            likedByMe: false,
        });
    });

    it("usa zeros quando o batch não traz o post", async () => {
        mockedBatch.mockResolvedValue({});
        const result = await attachLikes([samplePosts[0]]);
        expect(result[0].likeCount).toBe(0);
        expect(result[0].likedByMe).toBe(false);
    });
});
