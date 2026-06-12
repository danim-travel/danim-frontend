import { Link, Pencil, Share2, Trash2 } from "lucide-react";

interface BuildPostMenuArgs {
  isOwner: boolean;
  postId: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function buildPostContextMenu({ isOwner, postId, onEdit, onDelete }: BuildPostMenuArgs) {
  const shareUrl = `${window.location.origin}/?post=${postId}`;

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
