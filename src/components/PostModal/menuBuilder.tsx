import { Link, Pencil, Share2, Trash2 } from "lucide-react";
import { config } from "@/lib/config";
import { sharePost } from "@/lib/api/posts";
import { toast } from "@/store/toastStore";

const copyToClipboard = async (text: string): Promise<boolean> => {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
  }
  return false;
};

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
      onClick: async () => {
        triggerShareCount();
        const ok = await copyToClipboard(shareUrl);
        if (ok) toast.success("링크가 복사되었습니다.");
        else toast.error("링크 복사에 실패했습니다.");
      },
    },
    {
      label: "공유하기",
      icon: <Share2 className="w-[15px] h-[15px]" />,
      onClick: async () => {
        triggerShareCount();
        if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
          navigator.share({ url: shareUrl }).catch(() => {
            /* 사용자가 공유 시트를 닫는 경우 등은 무시 */
          });
          return;
        }
        const ok = await copyToClipboard(shareUrl);
        if (ok) toast.success("링크가 복사되었습니다.");
        else toast.error("공유에 실패했습니다.");
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
