'use client'

import Image from 'next/image'
import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'

// 컬럼 수(모바일 2 / 태블릿 3 / 데스크탑 4)와 같은 브레이크포인트를 쓴다.
// 지금은 next.config.ts의 images.unoptimized=true 때문에 srcset이 만들어지지 않아
// 브라우저가 이 값을 참고할 대상이 없다. 이미지 최적화를 켜는 순간 바로 동작하도록 값만 유지한다.
const GRID_SIZES = '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw'

export interface GridImageProps {
  src: string
  alt: string
  priority?: boolean
  className?: string
}

/**
 * 마소너리 카드용 이미지. 로딩 동안 스켈레톤을 깔아둔다.
 *
 * 칸 크기는 바깥 비율 상자(`aspect-(--card-ratio)`)가 이미 고정하므로,
 * 스켈레톤이 사라지고 이미지가 나타나도 레이아웃이 변하지 않는다.
 */
export function GridImage({ src, alt, priority, className }: GridImageProps) {
  const [loaded, setLoaded] = useState(false)

  // 캐시된 이미지는 onLoad가 붙기 전에 이미 로딩이 끝나 있을 수 있다.
  // 그 경우 onLoad가 영영 오지 않아 이미지가 투명한 채로 남는다.
  const checkComplete = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) setLoaded(true)
  }, [])

  return (
    <>
      {!loaded && <span aria-hidden className="absolute inset-0 animate-pulse bg-bg-subtle" />}
      <Image
        ref={checkComplete}
        src={src}
        alt={alt}
        fill
        sizes={GRID_SIZES}
        priority={priority}
        onLoad={() => setLoaded(true)}
        // 404·presigned URL 만료·네트워크 실패로 error가 나면 onLoad는 영영 오지 않는다.
        // 여기서 걷어주지 않으면 loaded가 false로 굳어 카드가 무한 펄스 상태로 남는다.
        onError={() => setLoaded(true)}
        className={cn(
          'object-cover',
          // LCP 후보는 opacity:0 인 동안 집계되지 않는다. 첫 화면 이미지(priority)에
          // 페이드를 걸면 그만큼 LCP가 밀리므로 페이드 없이 바로 보여준다.
          priority
            ? 'opacity-100'
            : ['transition-opacity duration-200', loaded ? 'opacity-100' : 'opacity-0'],
          className,
        )}
      />
    </>
  )
}

export default GridImage
