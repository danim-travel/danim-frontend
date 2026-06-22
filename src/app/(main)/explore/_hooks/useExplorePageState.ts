"use client"

import { useEffect } from "react"
import { useQueryState } from "nuqs"
import { getApiErrorMessage } from "@/lib/apiError"
import { toast } from "@/store/toastStore"
import { useExplorePosts } from "./useExplorePosts"

export function useExplorePageState(inputValue: string, category: string) {
  const [search, setSearch] = useQueryState("search", { defaultValue: "" })

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(inputValue.trim() || null)
    }, 300)
    return () => clearTimeout(t)
  }, [inputValue, setSearch])

  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useExplorePosts(search, category)

  const posts = data?.pages.flatMap((p) => p.results) ?? []

  useEffect(() => {
    if (isError) {
      toast.error(getApiErrorMessage(error, { client: "게시글을 불러오지 못했습니다." }))
    }
  }, [isError, error])

  return {
    posts,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  }
}
