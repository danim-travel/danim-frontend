import { Link, Pencil, Share2, Trash2 } from "lucide-react";
import { config } from "@/lib/config";
import { sharePost } from "@/lib/api/posts";

interface BuildPostMenuArgs {
  isOwner: boolean;
  postId: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function buildPostContextMenu({ isOwner, postId, onEdit, onDelete }: BuildPostMenuArgs) {
  const shareUrl = `${config.siteUrl}/posts/${postId}`;

  /**
   * 공유 카운트 집계 트리거 호출.
   * 응답의 redirect_url은 사용하지 않으며, 실패해도 클립보드 복사/공유 흐름은 그대로 진행한다.
   */
  const triggerShareCount = () => {
    sharePost(postId).catch(() => {
      /* 집계 실패는 사용자에게 노출하지 않는다 */
    });
  };

  const commonMenuItems = [
    {
      label: "링크 복사",
      icon: <Link className="w-[15px] h-[15px]" />,
      onClick: () => {
        triggerShareCount();
        navigator.clipboard?.writeText(shareUrl);
      },
    },
    {
      label: "공유하기",
      icon: <Share2 className="w-[15px] h-[15px]" />,
      onClick: () => {
        triggerShareCount();
        if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
          navigator.share({ url: shareUrl }).catch(() => {
            /* 사용자가 공유 시트를 닫는 경우 등은 무시 */
          });
          return;
        }
        navigator.clipboard?.writeText(shareUrl);
      },
    },
  ];
  const ownerMenuItems = [
    { divider: true as const },
    {
      label: "수정하기",
      icon: <Pencil className="w-[15px] h-[15px]" />,
      onClick: onEdit,
    },
    {
      label: "삭제하기",
      danger: true,
      icon: <Trash2 className="w-[15px] h-[15px]" />,
      onClick: onDelete,
    },
  ];
  return isOwner ? [...commonMenuItems, ...ownerMenuItems] : commonMenuItems;
}
