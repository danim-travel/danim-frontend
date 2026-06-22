// Parallel route `children` slot의 기본 fallback.
// 다른 slot이 매칭되지 않는 경로 전환 시 Next.js가 이 파일을 찾는다.
// 일반 페이지는 자체 page.tsx가 매칭되므로 호출되지 않으나, 경고 방지용 placeholder.
export default function RootDefault() {
  return null;
}
