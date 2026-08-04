import { api } from "./client";

export type LikeSummary = {
    post_id: number;
    count: number;
    liked_by_me: boolean;
};

export async function getLikesBatch(
    postIds: number[]
): Promise<Record<string, LikeSummary>> {
    if (postIds.length === 0) return {};
    const res = await api.get<Record<string, LikeSummary>>("/like/batch", {
        params: { post_ids: postIds },
        paramsSerializer: {
            indexes: null, // post_ids=1&post_ids=2
        },
    });
    return res.data;
}

export async function likePost(postId: number): Promise<{ liked: boolean; post_id: number }> {
    const res = await api.post<{ liked: boolean; post_id: number }>(`/like/${postId}`);
    return res.data;
}

export async function unlikePost(postId: number): Promise<{ liked: boolean; post_id: number }> {
    const res = await api.delete<{ liked: boolean; post_id: number }>(`/like/${postId}`);
    return res.data;
}
