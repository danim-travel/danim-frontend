/**
 * 핀터레스트 스타일 그리드에서 이미지 비율을 모를 때 순환 적용하는 aspect-ratio 클래스 배열.
 * ExploreGrid, PostGrid 등 마소너리 그리드에서 공통으로 사용한다.
 */
export const GRID_ASPECT_RATIOS = [
  'aspect-[2/3]',
  'aspect-[1/1]',
  'aspect-[16/9]',
  'aspect-[3/4]',
  'aspect-[1/1]',
  'aspect-[9/16]',
]

/**
 * next/image placeholder="blur" 용 단색 blurDataURL.
 * 실제 썸네일 데이터가 없는 경우 연한 회색(#EFEFEF) 1×1 SVG를 base64로 인코딩해 사용한다.
 */
const toBase64 = (str: string): string =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)

const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'><rect fill='#D3EFE0'/></svg>`

export const BLUR_DATA_URL = `data:image/svg+xml;base64,${toBase64(svg)}`
