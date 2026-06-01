import React from "react";
import Card from "../../common/Card/Card";
import Avatar from "../../common/Avatar/Avatar";
import Badge from "../../common/Badge/Badge";
import PostActionBar from "./PostActionBar";

export interface PostCardProps {
  author: { name: string; initial: string; color?: string; region: string };
  location: string;
  coverImage?: string;
  text: string;
  likeCount: number;
  liked?: boolean;
  saved?: boolean;
  onLike?: () => void;
  onSave?: () => void;
}

export function PostCard({ author, location, coverImage, text, likeCount, liked, saved, onLike, onSave }: PostCardProps) {
  return (
    <Card padding="none" interactive className="overflow-hidden">
      <div
        className="h-[200px] relative bg-bg-subtle"
        style={coverImage ? { backgroundImage: `url(${coverImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        <span className="absolute top-3 left-3">
          <Badge variant="tag" leftIcon={<span aria-hidden>📍</span>}>{location}</Badge>
        </span>
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Avatar size="sm" initial={author.initial} color={author.color} />
          <div>
            <div className="text-[13px] font-bold text-text">{author.name}</div>
            <div className="text-[12px] text-text-muted">{author.region}</div>
          </div>
        </div>
        <p className="text-[13px] leading-[1.6] text-text-secondary whitespace-pre-line">{text}</p>
        <PostActionBar likeCount={likeCount} liked={liked} saved={saved} onLike={onLike} onSave={onSave} />
      </div>
    </Card>
  );
}

export default PostCard;
