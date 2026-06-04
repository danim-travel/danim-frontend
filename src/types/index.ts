export type DetailResponse = {
  detail: string
}

export type ApiErrorResponse =
  | { error_detail: string }
  | { error_detail: Record<string, string[]> }

export * from './post.types'
