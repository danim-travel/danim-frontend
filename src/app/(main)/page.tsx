"use client";

import { useCallback, useState } from "react";
import PostModal from "@/components/PostModal";
import { useUIStore } from "@/store/uiStore";
import type { FeedPost } from "@/types";
import FeedPanel from "./_components/FeedPanel";
import MapPanel from "./_components/MapPanel";
import { DUMMY_FEED } from "./_mocks/feed";

export default function HomePage() {
  const [focusedPost, setFocusedPost] = useState<FeedPost | null>(null);
  const postModalId = useUIStore((s) => s.postModalId);
  const openPostModal = useUIStore((s) => s.openPostModal);
  const closePostModal = useUIStore((s) => s.closePostModal);

  const handleSelectPost = useCallback((post: FeedPost) => {
    setFocusedPost(post);
  }, []);

  return (
    <div className="flex h-full gap-4 p-4 bg-bg">
      <FeedPanel
        posts={DUMMY_FEED}
        focusedPostId={focusedPost?.post.post_id ?? null}
        onSelectPost={handleSelectPost}
      />
      <MapPanel
        focusedPost={focusedPost}
        onPinClick={openPostModal}
        onResetFocus={() => setFocusedPost(null)}
      />

      {postModalId && <PostModal postId={postModalId} onClose={closePostModal} />}
    </div>
  );
}
