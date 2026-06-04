import { Link, Pencil, Share2, Trash2 } from "lucide-react";

interface BuildPostMenuArgs {
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * 게시글 케밥 메뉴 항목 구성. is_owner 인 경우 수정/삭제가 추가된다.
 * UI 변경 시 이 함수만 손보면 PostModal 본체는 그대로.
 */
export function buildPostContextMenu({ isOwner, onEdit, onDelete }: BuildPostMenuArgs) {
  const commonMenuItems = [
    {
      label: "링크 복사",
      icon: <Link className="w-[15px] h-[15px]" />,
      onClick: () => navigator.clipboard?.writeText(window.location.href),
    },
    {
      label: "공유하기",
      icon: <Share2 className="w-[15px] h-[15px]" />,
      onClick: () => navigator.share?.({ url: window.location.href }),
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
