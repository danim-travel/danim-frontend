import { Link, Pencil, Share2, Trash2 } from "lucide-react";

interface BuildPostMenuArgs {
  isOwner: boolean;
  postId: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function buildPostContextMenu({ isOwner, postId, onEdit, onDelete }: BuildPostMenuArgs) {
  // postId를 URL 인코딩해 특수문자가 포함된 경우에도 올바른 URL이 생성되도록 한다
  const shareUrl = `${window.location.origin}/?post=${encodeURIComponent(postId)}`;

  const commonMenuItems = [
    {
      label: "링크 복사",
      icon: <Link className="w-[15px] h-[15px]" />,
      onClick: () => navigator.clipboard?.writeText(shareUrl),
    },
    {
      label: "공유하기",
      icon: <Share2 className="w-[15px] h-[15px]" />,
      onClick: () => navigator.share?.({ url: shareUrl }),
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
