// 허용 목록·크기 상한은 백엔드 화이트리스트와 맞춰 한곳에서만 정의한다.
// 여기서 값을 다시 적으면 게시글·DM·프로필 쪽과 조용히 어긋난다.
export {
  ALLOWED_COMMENT_IMAGE_TYPES,
  COMMENT_IMAGE_ACCEPT,
  MAX_IMAGE_SIZE_BYTES as MAX_COMMENT_IMAGE_SIZE_BYTES,
} from "@/lib/media/imageConstraints";
