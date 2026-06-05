import type { FeedPost, Post } from "@/types";

/** FeedPost(API 응답)를 KakaoMap이 소비하는 Post 형태로 변환한다. */
export function toMapPost(feed: FeedPost, color: string): Post {
  return {
    post_id: feed.post.post_id,
    color,
    pins: (feed.spots ?? []).map((s) => ({ lat: s.y, lng: s.x })),
  };
}
