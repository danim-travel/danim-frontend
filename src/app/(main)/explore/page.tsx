"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQueryState } from "nuqs"
import { PageContainer, SearchBar } from "@/components/common"
import { toast } from "@/store/toastStore"
import { getApiErrorMessage } from "@/lib/apiError"
import PostModal from "@/components/PostModal"
import { useExplorePosts } from "./_hooks/useExplorePosts"
import { ExploreGrid } from "./_components/ExploreGrid"

const CATEGORIES = ["전체", "경기", "강원", "충청", "전라", "경상", "제주", "서울"] as const
type Category = (typeof CATEGORIES)[number]

export default function ExplorePage() {
  const router = useRouter()
  const [search, setSearch] = useQueryState("search", { defaultValue: "" })
  const [inputValue, setInputValue] = useState(search)
  const [category, setCategory] = useState<Category>("전체")
  const [postModalId, setPostModalId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(inputValue.trim() || null)
    }, 300)
    return () => clearTimeout(t)
  }, [inputValue, setSearch])

  const { data, isLoading, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useExplorePosts(search, category)

  const posts = data?.pages.flatMap((p) => p.results) ?? []

  useEffect(() => {
    if (isError) {
      toast.error(getApiErrorMessage(error, { client: "게시글을 불러오지 못했습니다." }))
    }
  }, [isError, error])

  const handleLoadMore = useCallback(() => { fetchNextPage() }, [fetchNextPage])

  return (
    <PageContainer className="flex flex-col gap-(--section-gap)">
      <h1 className="text-section-title font-bold text-text">탐색</h1>

      <SearchBar
        value={inputValue}
        variant="panel"
        placeholder="여행지, 장소 검색..."
        onChange={(e) => setInputValue(e.target.value)}
        onClear={() => { setInputValue(""); setSearch(null) }}
      />

      <div className="flex items-center gap-(--icon-gap) flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            data-testid={`category-btn-${cat}`}
            onClick={() => setCategory(cat)}
            className={[
              "px-5 py-2.5 rounded-(--chip-radius) text-body-sm font-semibold transition-colors border",
              category === cat
                ? "bg-(--chip-bg-selected) text-(color:--chip-text-selected) border-transparent"
                : "bg-(--chip-bg) text-(color:--chip-text) border-(--chip-border) hover:bg-bg-subtle",
            ].join(" ")}
          >
            {cat}
          </button>
        ))}
      </div>

      <ExploreGrid
        posts={posts}
        isLoading={isLoading}
        hasNextPage={!!hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={handleLoadMore}
        onPostClick={setPostModalId}
      />

      {postModalId && (
        <PostModal
          postId={postModalId}
          onClose={() => setPostModalId(null)}
          showGoToMain
          onGoToMain={() => {
            sessionStorage.setItem("scrollToPostId", postModalId)
            router.push(`/?solo=${postModalId}`)
          }}
        />
      )}
    </PageContainer>
  )
}
