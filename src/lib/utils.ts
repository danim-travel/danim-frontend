import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// 커스텀 text-* 토큰을 font-size 그룹으로 등록
// tailwind-merge가 text-caption, text-body-sm 등을 color 유틸리티(text-text-muted 등)와
// 충돌로 잘못 판단해 제거하는 문제를 방지한다.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-display',
        'text-page-title',
        'text-section-title',
        'text-card-title',
        'text-base',
        'text-body-sm',
        'text-caption',
        'text-label',
        'text-button',
        'text-nav',
        'text-tiny',
        'text-title-lg',
        'text-hero',
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
