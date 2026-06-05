import type { FeedPost } from "@/types";

export const DUMMY_FEED: FeedPost[] = [
  {
    user: {
      user_id: "u1",
      nickname: "지현",
      profile_img: "https://picsum.photos/seed/jihyun/100/100",
    },
    post: {
      post_id: "feed-1",
      title: "제주 동쪽 해안 드라이브 코스",
      thumbnail: "https://picsum.photos/seed/jeju-east/800/450",
      content: "성산일출봉 정상에서 보는 일출, 말로 표현이 안 돼요. 이른 아침 하늘이 분홍빛으로 물드는 그 순간 차를 세우고 한참을 멍하니 바라봤어요.",
      address_name: "제주특별자치도 서귀포시 성산읍 성산리 1",
      spot_count: 3,
    },
    comment_count: 41,
    is_liked: false,
    like_count: 312,
    is_bookmarked: false,
    spots: [
      { x: 126.9428, y: 33.4580 },
      { x: 126.9289, y: 33.4287 },
      { x: 126.9499, y: 33.4636 },
    ],
  },
  {
    user: {
      user_id: "u2",
      nickname: "민재",
      profile_img: "https://picsum.photos/seed/minjae/100/100",
    },
    post: {
      post_id: "feed-2",
      title: "부산 광안리 야경 제대로 즐기는 법",
      thumbnail: "https://picsum.photos/seed/gwangan/800/450",
      content: "광안대교 야경 보려면 동쪽 끝 모래사장이 포인트예요. 삼각대 없어도 핸드폰으로 충분히 나와요.",
      address_name: "부산광역시 수영구 광안동 195-1",
      spot_count: 2,
    },
    comment_count: 23,
    is_liked: true,
    like_count: 187,
    is_bookmarked: true,
    spots: [
      { x: 129.1187, y: 35.1533 },
      { x: 129.1241, y: 35.1575 },
    ],
  },
  {
    user: {
      user_id: "u3",
      nickname: "수진",
      profile_img: null,
    },
    post: {
      post_id: "feed-3",
      title: "연남동 카페 투어 루트 공유",
      thumbnail: "https://picsum.photos/seed/yeonnam/800/450",
      content: "연트럴파크에서 시작해서 골목골목 숨은 카페 다섯 곳 다녀왔어요. 오후 2시쯤 가면 웨이팅 없이 들어갈 수 있어요.",
      address_name: "서울특별시 마포구 연남동 391-20",
      spot_count: 2,
    },
    comment_count: 33,
    is_liked: false,
    like_count: 204,
    is_bookmarked: false,
    spots: [
      { x: 126.9216, y: 37.5609 },
      { x: 126.9239, y: 37.5574 },
    ],
  },
  {
    user: {
      user_id: "u4",
      nickname: "태양",
      profile_img: "https://picsum.photos/seed/taeyang/100/100",
    },
    post: {
      post_id: "feed-4",
      title: "강릉 당일치기 완벽 코스",
      thumbnail: "https://picsum.photos/seed/gangneung/800/450",
      content: "바다 보면서 마시는 커피는 진짜 별미예요. 새벽 첫 KTX 타면 8시에 도착해서 여유롭게 돌아볼 수 있어요.",
      address_name: "강원특별자치도 강릉시 견소동 50-2",
      spot_count: 3,
    },
    comment_count: 67,
    is_liked: true,
    like_count: 445,
    is_bookmarked: true,
    spots: [
      { x: 128.9249, y: 37.7669 },
      { x: 128.8786, y: 37.7483 },
      { x: 128.9089, y: 37.8044 },
    ],
  },
  {
    user: {
      user_id: "u5",
      nickname: "보라",
      profile_img: "https://picsum.photos/seed/bora/100/100",
    },
    post: {
      post_id: "feed-5",
      title: "전주 한옥마을 반나절 산책",
      thumbnail: "https://picsum.photos/seed/jeonju/800/450",
      content: "한옥마을 골목이 생각보다 훨씬 예뻤어요. 막걸리 한 잔 마시면서 돌아다니니까 시간 가는 줄 몰랐어요.",
      address_name: "전라북도 전주시 완산구 풍남동3가 102",
      spot_count: 2,
    },
    comment_count: 18,
    is_liked: false,
    like_count: 129,
    is_bookmarked: false,
    spots: [
      { x: 127.1522, y: 35.8146 },
      { x: 127.1536, y: 35.8161 },
    ],
  },
];
