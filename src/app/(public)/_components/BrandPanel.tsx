import { Pacifico } from 'next/font/google'
import styles from './AuthVisuals.module.css'

const pacifico = Pacifico({ subsets: ['latin'], weight: '400' })

const FEATURES = [
  '실시간 여행 위치 공유',
  '감성 여행 사진 피드',
  '여행자 커뮤니티 연결',
]

export function BrandPanel() {
  return (
    <div className="flex flex-col justify-center px-12 select-none">
      {/* 로고 */}
      <div className="mb-10">
        <p className={`text-5xl leading-none ${pacifico.className} ${styles.brandLogoText}`}>
          Danim
        </p>
      </div>

      {/* 메인 헤딩 */}
      <h1 className="text-5xl font-bold leading-tight text-foreground mb-6">
        여행의<br />
        <span className="text-primary">모든 순간을</span><br />
        기록하세요.
      </h1>

      {/* 설명 */}
      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
        제주, 부산, 경주, 여수 … 전국 여행자들과 나누는 진짜 이야기
      </p>

      {/* 기능 목록 */}
      <ul className="space-y-3">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-foreground/80">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default BrandPanel
