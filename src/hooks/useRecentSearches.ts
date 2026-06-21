"use client"
import { useCallback, useState } from "react"
import type { UserSearchResult } from "@/types/user.types"

const STORAGE_KEY = "danim_recent_searches"
const MAX_RECENT = 20

function readStorage(): UserSearchResult[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is UserSearchResult =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as UserSearchResult).user_id === "string" &&
        typeof (item as UserSearchResult).nickname === "string"
    )
  } catch {
    return []
  }
}

function writeStorage(items: UserSearchResult[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // 저장 실패(용량 초과 등)는 무시한다.
  }
}

/**
 * 최근 검색한 유저 기록을 localStorage에 저장/조회/삭제하는 훅.
 * 최신순으로 정렬되며 최대 20개까지 유지한다.
 */
export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<UserSearchResult[]>(readStorage)

  const addRecentSearch = useCallback((user: UserSearchResult) => {
    setRecentSearches((prev) => {
      const next = [
        { user_id: user.user_id, nickname: user.nickname, profile_img: user.profile_img },
        ...prev.filter((item) => item.user_id !== user.user_id),
      ].slice(0, MAX_RECENT)
      writeStorage(next)
      return next
    })
  }, [])

  const removeRecentSearch = useCallback((userId: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((item) => item.user_id !== userId)
      writeStorage(next)
      return next
    })
  }, [])

  return { recentSearches, addRecentSearch, removeRecentSearch }
}
