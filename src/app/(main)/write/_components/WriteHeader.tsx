'use client'

import { memo } from 'react'
import { PenLine } from 'lucide-react'
import { Button } from '@/components/common'

interface WriteHeaderProps {
  onCancel: () => void
}

const WriteHeader = memo(function WriteHeader({ onCancel }: WriteHeaderProps) {
  return (
    <div className="flex items-center justify-between px-7 py-4 border-b border-border-subtle shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
          <PenLine className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-base font-bold text-text">여행 기록하기</h1>
          <p className="text-nav text-text-disabled mt-0.5">당신의 소중한 순간을 기록해보세요</p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onCancel}>
        취소
      </Button>
    </div>
  )
})

export default WriteHeader
