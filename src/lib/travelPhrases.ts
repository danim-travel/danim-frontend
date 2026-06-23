export interface TravelPhrase {
  phrase: string;
  characterSrc: string;
}

export const TRAVEL_PHRASES: TravelPhrase[] = [
  { phrase: "오늘은 어떤 여행을 떠나셨나요?", characterSrc: "/characters/char-wave.png" },
  { phrase: "오늘의 여정을 함께 나눠볼까요?", characterSrc: "/characters/char-heart.png" },
  { phrase: "오늘 발견한 곳은 어디인가요?", characterSrc: "/characters/char-map.png" },
  { phrase: "나만의 여행 기록을 공유해보세요 ✈", characterSrc: "/characters/char-sit.png" },
  { phrase: "오늘의 발걸음을 이야기로 남겨보세요", characterSrc: "/characters/char-bag.png" },
];
