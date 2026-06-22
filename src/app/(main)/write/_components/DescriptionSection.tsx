'use client'

import { memo } from 'react'
import { TextField } from '@/components/common'

interface DescriptionSectionProps {
  description: string
  setDescription: (v: string) => void
  error?: string
}

const MAX_LENGTH = 100

const DescriptionSection = memo(function DescriptionSection({
  description,
  setDescription,
  error,
}: DescriptionSectionProps) {
  return (
    <TextField
      label="한 줄 소개"
      required
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      placeholder="여행을 한 줄로 소개해보세요"
      autoComplete="off"
      maxLength={MAX_LENGTH}
      rightSlot={
        <span className="text-nav text-text-disabled">
          {description.length}/{MAX_LENGTH}
        </span>
      }
      error={error}
    />
  )
})

export default DescriptionSection
