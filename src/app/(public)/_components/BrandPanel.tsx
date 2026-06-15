const FEATURES = ["실시간 여행 위치 공유", "감성 여행 사진 피드", "여행자 커뮤니티 연결"];

/** 로그인 화면 좌측 브랜드 인트로. lg 이상에서만 노출. */
export function BrandPanel() {
  return (
    <div className="flex flex-col gap-7 max-w-[480px] shrink-0">
      {/* 로고 */}
      <div className="flex items-center gap-3">
        <img src="/favicon.svg" alt="Danim" className="w-14 h-14 rounded-md shadow-brand-strong shrink-0" />
        <div>
          <div className="text-section-title font-bold text-text tracking-tight">Danim</div>
          <div className="text-body-sm text-text-muted">여행자들의 이야기</div>
        </div>
      </div>

      {/* 히어로 */}
      <h1 className="text-display font-extrabold leading-tight tracking-tight text-text">
        여행의<br />
        <span className="text-primary">모든 순간을</span><br />
        기록하세요.
      </h1>

      <p className="text-base leading-relaxed text-text-muted">
        제주, 부산, 경주, 여수 … 전국 여행자들과 나누는 진짜 이야기
      </p>

      <ul className="flex flex-col gap-3 pt-3">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-3 text-base text-text-secondary">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
