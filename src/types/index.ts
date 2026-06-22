export type DetailResponse = {
  detail: string
}

export type ApiErrorResponse =
  | { error_detail: string }
  | { error_detail: Record<string, string[]> }

export * from './post.types'
export * from './comment.types'
export * from './interaction.types'
export * from './user.types'
export * from './notification.types'
export * from './dm.types'
