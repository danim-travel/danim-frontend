import { Spinner } from "@/components/ui/spinner"

interface Props {
  /** 데이터 로딩 중 ImagePane 자리에 흐릿하게 깔 placeholder 이미지 URL */
  placeholderThumbnail?: string
}

export function PostModalSkeleton({ placeholderThumbnail }: Props = {}) {
  return (
    <>
      {/* ImagePane skeleton */}
      <div className="w-1/2 shrink-0 flex flex-col overflow-hidden">
        <div className="flex-1 bg-bg-subtle flex items-center justify-center min-h-[520px] relative overflow-hidden">
          {placeholderThumbnail && (
            // 진입한 페이지(피드/그리드)에서 이미 캐시된 썸네일을 즉시 깔아 회색 깜빡임 방지
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={placeholderThumbnail}
              alt=""
              aria-hidden
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60"
            />
          )}
          <Spinner size="lg" />
        </div>
        <div className="px-6 py-5 bg-bg-card border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-bg-subtle animate-pulse" />
              <div className="h-2.5 w-14 bg-bg-subtle animate-pulse rounded-full" />
            </div>
            <div className="flex-1 h-px bg-bg-subtle mx-3" />
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-bg-subtle animate-pulse" />
              <div className="h-2.5 w-16 bg-bg-subtle animate-pulse rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* DetailPane skeleton */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="flex flex-col gap-5 px-6 pt-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-bg-subtle animate-pulse shrink-0" />
            <div className="h-4 w-24 bg-bg-subtle animate-pulse rounded-md" />
          </div>
          <div className="space-y-2.5">
            <div className="h-3.5 bg-bg-subtle animate-pulse rounded w-full" />
            <div className="h-3.5 bg-bg-subtle animate-pulse rounded w-4/5" />
            <div className="h-3.5 bg-bg-subtle animate-pulse rounded w-2/5" />
          </div>
        </div>
        <div className="mt-auto flex flex-col">
          <div className="flex flex-col gap-4 px-6 py-4 border-t border-border-subtle">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-bg-subtle animate-pulse shrink-0" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="h-3 bg-bg-subtle animate-pulse rounded w-1/4" />
                  <div className="h-3 bg-bg-subtle animate-pulse rounded w-3/5" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2.5 px-6 py-3 pb-4 border-t border-border-subtle">
            <div className="flex-1 h-10 bg-bg-subtle animate-pulse rounded-full" />
            <div className="h-8 w-14 bg-bg-subtle animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    </>
  )
}
