import { getLikesBatch } from "./likes";
import type { Post, PostWithLikes } from "./posts";

export async function attachLikes(posts: Post[]): Promise<PostWithLikes[]> {
    if (posts.length === 0) return [];
    const summary = await getLikesBatch(posts.map((p) => p.id));
    return posts.map((p) => {
        // Batch pode indexar por string ou number, conforme serialização do JSON.
        const info = summary[String(p.id)] ?? summary[p.id as unknown as string];
        return {
            ...p,
            likeCount: info?.count ?? 0,
            likedByMe: info?.liked_by_me ?? false,
        };
    });
}
