'use client'

import { memo } from 'react'
import { TextField } from '@/components/common'

interface DescriptionSectionProps {
  description: string
  setDescription: (v: string) => void
}

const MAX_LENGTH = 100

const DescriptionSection = memo(function DescriptionSection({
  description,
  setDescription,
}: DescriptionSectionProps) {
  return (
    <TextField
      label="한 줄 소개"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      placeholder="여행을 한 줄로 소개해보세요"
      maxLength={MAX_LENGTH}
      rightSlot={
        <span className="text-nav text-text-disabled">
          {description.length}/{MAX_LENGTH}
        </span>
      }
    />
  )
})

export default DescriptionSection
