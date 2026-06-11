'use client'

import { memo } from 'react'
import { TextField } from '@/components/common'

interface TitleSectionProps {
  title: string
  setTitle: (v: string) => void
}

const TitleSection = memo(function TitleSection({ title, setTitle }: TitleSectionProps) {
  return (
    <TextField
      label="제목"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      placeholder="여행의 제목을 입력하세요"
      maxLength={50}
      rightSlot={<span className="text-nav text-text-disabled">{title.length}/50</span>}
    />
  )
})

export default TitleSection
