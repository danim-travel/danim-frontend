import type { CreatePostSpotLocation, CreatePostSpotImage } from '@/types'

export type SpotFormData = {
  id: string
  location: CreatePostSpotLocation | null
  content: string
  images: CreatePostSpotImage[]
  previewUrls: string[]
}
