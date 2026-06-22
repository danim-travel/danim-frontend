'use client'

import { memo } from 'react'
import { TextField } from '@/components/common'

interface TitleSectionProps {
  title: string
  setTitle: (v: string) => void
  error?: string
}

const TitleSection = memo(function TitleSection({ title, setTitle, error }: TitleSectionProps) {
  return (
    <TextField
      label="제목"
      required
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      placeholder="여행의 제목을 입력하세요"
      autoComplete="off"
      maxLength={50}
      rightSlot={<span className="text-nav text-text-disabled">{title.length}/50</span>}
      error={error}
    />
  )
})

export default TitleSection
